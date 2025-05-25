import { NextRequest, NextResponse } from 'next/server';
import { Socket } from 'net';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ip = formData.get('ip') as string;
    const port = formData.get('port') as string;
    const transferId = formData.get('transferId') as string;
    const folder = formData.get('folder') as string | null;
    const fileCount = parseInt(formData.get('fileCount') as string || '0');

    // Handle multiple files
    const files: File[] = [];
    if (fileCount > 0) {
      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File;
        if (file) {
          files.push(file);
        }
      }
    } else {
      // Fallback for single file (backward compatibility)
      const singleFile = formData.get('file') as File;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0 || !ip || !port || !transferId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process files sequentially
    const results: any[] = [];
    
    for (const file of files) {
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        
        // Connect to TCP server for each file
        const socket = new Socket();
        
        const transferResult = await new Promise((resolve) => {
          socket.connect(parseInt(port), ip, () => {
            console.log(`Connected to TCP server at ${ip}:${port} for file: ${fileName}`);
            
            // Send TRANSFER command
            const command = folder && folder.trim() 
              ? `TRANSFER ${transferId} ${fileName} ${folder.trim()}`
              : `TRANSFER ${transferId} ${fileName}`;
            socket.write(command);
            
            // Send file size (8 bytes, big-endian)
            const sizeBuffer = Buffer.alloc(8);
            sizeBuffer.writeBigUInt64BE(BigInt(fileBuffer.length), 0);
            socket.write(sizeBuffer);
            
            // Wait for ACK before sending file data
            socket.once('data', (data) => {
              const response = data.toString().trim();
              console.log('Received response:', response);
              
              if (response === 'ACK') {
                // Send file data after receiving ACK
                socket.write(fileBuffer);
                
                // Wait for final response
                socket.once('data', (finalData) => {
                  const finalResponse = finalData.toString().trim();
                  console.log('Final response:', finalResponse);
                  
                  if (finalResponse.includes('TRANSFER_COMPLETE')) {
                    resolve({ success: true, fileName, message: 'Transfer completed successfully' });
                  } else {
                    resolve({ success: false, fileName, error: finalResponse });
                  }
                  
                  socket.end();
                });
              } else {
                // Error response instead of ACK
                resolve({ success: false, fileName, error: response });
                socket.end();
              }
            });
          });
          
          socket.on('error', (error) => {
            console.error('Socket error:', error);
            resolve({ success: false, fileName, error: `Connection failed: ${error.message}` });
          });
          
          socket.on('timeout', () => {
            console.error('Socket timeout');
            socket.destroy();
            resolve({ success: false, fileName, error: 'Connection timed out' });
          });
          
          // Set timeout
          socket.setTimeout(30000);
        });
        
        results.push(transferResult);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({ success: false, fileName: file.name, error: 'File processing error' });
      }
    }
    
    // Return combined results
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      return NextResponse.json({ 
        success: true, 
        message: `All ${totalCount} file(s) transferred successfully`,
        results 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: `${successCount}/${totalCount} file(s) transferred successfully`,
        results 
      });
    }


  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 