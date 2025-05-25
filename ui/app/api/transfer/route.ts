import { NextRequest, NextResponse } from 'next/server';
import { Socket } from 'net';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ip = formData.get('ip') as string;
    const port = formData.get('port') as string;
    const transferId = formData.get('transferId') as string;
    const folder = formData.get('folder') as string | null;

    if (!file || !ip || !port || !transferId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    // Connect to TCP server
    const socket = new Socket();
    
    return new Promise((resolve) => {
      let responseData = '';
      
      socket.connect(parseInt(port), ip, () => {
        console.log(`Connected to TCP server at ${ip}:${port}`);
        
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
                resolve(NextResponse.json({ success: true, message: 'Transfer completed successfully' }));
              } else {
                resolve(NextResponse.json({ success: false, error: finalResponse }));
              }
              
              socket.end();
            });
          } else {
            // Error response instead of ACK
            resolve(NextResponse.json({ success: false, error: response }));
            socket.end();
          }
        });
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        resolve(NextResponse.json({ 
          success: false, 
          error: `Connection failed: ${error.message}` 
        }));
      });
      
      socket.on('timeout', () => {
        console.error('Socket timeout');
        socket.destroy();
        resolve(NextResponse.json({ 
          success: false, 
          error: 'Connection timed out' 
        }));
      });
      
      // Set timeout
      socket.setTimeout(30000);
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 