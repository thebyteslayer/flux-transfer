use anyhow::{Context, Result};
use log::{info, warn, error};
use std::path::PathBuf;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    fs,
};
use crate::config::Config;
use crate::structure;

/// Start the custom TCP transfer server
pub async fn start_tcp_server(bind: &str, port: u16) -> Result<()> {
    let addr = format!("{}:{}", bind, port); // Transfer server runs on main port
    let listener = TcpListener::bind(&addr).await
        .with_context(|| format!("Failed to bind TCP transfer server to {}", addr))?;
    
    info!("Custom TCP transfer server listening on {}", addr);
    
    loop {
        match listener.accept().await {
            Ok((stream, addr)) => {
                info!("New TCP transfer connection from: {}", addr);
                tokio::spawn(async move {
                    if let Err(e) = handle_tcp_connection(stream).await {
                        error!("Error handling TCP connection from {}: {}", addr, e);
                    }
                });
            }
            Err(e) => {
                error!("Failed to accept TCP connection: {}", e);
            }
        }
    }
}

/// Handle TCP connection with custom transfer protocol
async fn handle_tcp_connection(mut stream: TcpStream) -> Result<()> {
    let mut buffer = vec![0; 8192];
    
    loop {
        // Read command from client
        let n = stream.read(&mut buffer).await
            .context("Failed to read from TCP stream")?;
            
        if n == 0 {
            info!("Client disconnected");
            break;
        }
        
        let command = String::from_utf8_lossy(&buffer[..n]).trim().to_string();
        info!("Received command: {}", command);
        
        // Parse and handle command
        let response = match parse_and_handle_command(&command, &mut stream).await {
            Ok(resp) => resp,
            Err(e) => {
                error!("Command error: {}", e);
                format!("ERROR: {}", e)
            }
        };
        
        // Send response back to client (unless it was a file transfer)
        if !response.is_empty() {
            stream.write_all(response.as_bytes()).await
                .context("Failed to write response to TCP stream")?;
            stream.write_all(b"\n").await
                .context("Failed to write newline to TCP stream")?;
        }
    }
    
    Ok(())
}

/// Parse and handle the custom TRANSFER command
async fn parse_and_handle_command(command: &str, stream: &mut TcpStream) -> Result<String> {
    let command = command.trim();
    
    if command.is_empty() {
        return Err(anyhow::anyhow!("Empty command"));
    }
    
    // Check if it starts with TRANSFER
    if !command.to_uppercase().starts_with("TRANSFER ") {
        let first_word = command.split_whitespace().next().unwrap_or("");
        return Err(anyhow::anyhow!("Unknown command: {}. Available commands: TRANSFER", first_word));
    }
    
    // Remove "TRANSFER " prefix (8 characters)
    let remaining = &command[8..].trim();
    
    // Find the first space to separate transfer_id from the rest
    if let Some(first_space) = remaining.find(' ') {
        let transfer_id = &remaining[..first_space];
        let rest = &remaining[first_space + 1..].trim();
        
        // Find the last space to separate folder from filename (if folder exists)
        // We assume that if there are multiple spaces, the last "word" is the folder
        // and everything before it is the filename
        if let Some(last_space) = rest.rfind(' ') {
            // Check if the last part looks like a folder (no file extension)
            let potential_folder = &rest[last_space + 1..];
            let potential_filename = &rest[..last_space];
            
            // If the potential folder doesn't contain a dot, treat it as a folder
            // Otherwise, treat the entire rest as filename
            if !potential_folder.contains('.') && !potential_folder.is_empty() {
                handle_transfer_command(transfer_id, potential_filename, Some(potential_folder), stream).await
            } else {
                handle_transfer_command(transfer_id, rest, None, stream).await
            }
        } else {
            // No additional spaces, so it's just filename
            handle_transfer_command(transfer_id, rest, None, stream).await
        }
    } else {
        return Err(anyhow::anyhow!("TRANSFER command usage: TRANSFER <transfer_id> <file> [<folder>]"));
    }
}

/// Handle TRANSFER command - receives a file with the given transfer_id
async fn handle_transfer_command(transfer_id: &str, filename: &str, folder: Option<&str>, stream: &mut TcpStream) -> Result<String> {
    info!("Handling TRANSFER command - transfer_id: {}, file: {}, folder: {:?}", transfer_id, filename, folder);
    
    // Load config to verify we can accept this transfer
    let config = Config::load_or_create()
        .context("Failed to load config")?;
    
    // Check if this is our transfer_id (optional validation)
    if transfer_id != config.transfer_id {
        warn!("Transfer ID mismatch. Expected: {}, Received: {}", config.transfer_id, transfer_id);
        // Still allow the transfer but log the mismatch
    }
    
    // Ensure target directory exists and get the path
    let receive_dir = structure::ensure_directory_exists(&config.folder, folder).await
        .context("Failed to ensure receive directory exists")?;
    
    // Read file size first to check limits BEFORE sending ACK
    let mut buffer = [0u8; 8];
    stream.read_exact(&mut buffer).await
        .context("Failed to read file size")?;
    let file_size = u64::from_be_bytes(buffer);
    
    info!("Incoming file: {} ({} bytes)", filename, file_size);
    
    // Check size limits before sending ACK
    if let Err(e) = check_size_limits(&config, file_size, &receive_dir).await {
        error!("Size limit exceeded: {}", e);
        
        // Send error response instead of ACK
        let error_msg = if e.to_string().contains("File size") {
            format!("FILE_SIZE_LIMIT_EXCEEDED: {}", e)
        } else {
            format!("FOLDER_SIZE_LIMIT_EXCEEDED: {}", e)
        };
        
        stream.write_all(error_msg.as_bytes()).await
            .context("Failed to send error response")?;
        stream.write_all(b"\n").await
            .context("Failed to send newline")?;
        
        return Err(e);
    }
    
    // Send acknowledgment only if size limits are OK
    stream.write_all(b"ACK\n").await
        .context("Failed to send ACK")?;
    
    // Receive file data
    match receive_file_data_with_size(stream, &receive_dir, filename, file_size as usize).await {
        Ok(received_filename) => {
            info!("Successfully received file: {}", received_filename);
            
            Ok(format!("TRANSFER_COMPLETE: {}", received_filename))
        }
        Err(e) => {
            error!("Failed to receive file: {}", e);
            
            Err(e)
        }
    }
}

/// Generate a unique filename if the original already exists
async fn generate_unique_filename(transfer_dir: &PathBuf, filename: &str) -> String {
    let file_path = transfer_dir.join(filename);
    
    // If file doesn't exist, use original name
    if !tokio::fs::try_exists(&file_path).await.unwrap_or(false) {
        return filename.to_string();
    }
    
    // Split filename into name and extension
    let path = std::path::Path::new(filename);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or(filename);
    let extension = path.extension().and_then(|s| s.to_str());
    
    // Try incrementing numbers until we find a unique name
    let mut counter = 1;
    loop {
        let new_filename = if let Some(ext) = extension {
            format!("{}{}.{}", stem, counter, ext)
        } else {
            format!("{}{}", stem, counter)
        };
        
        let new_file_path = transfer_dir.join(&new_filename);
        if !tokio::fs::try_exists(&new_file_path).await.unwrap_or(false) {
            return new_filename;
        }
        
        counter += 1;
        
        // Safety check to prevent infinite loop
        if counter > 9999 {
            // Fallback to timestamp-based naming
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            
            return if let Some(ext) = extension {
                format!("{}{}.{}", stem, timestamp, ext)
            } else {
                format!("{}{}", stem, timestamp)
            };
        }
    }
}

/// Receive file data from TCP stream when size is already known
async fn receive_file_data_with_size(stream: &mut TcpStream, transfer_dir: &PathBuf, filename: &str, file_size: usize) -> Result<String> {
    info!("Receiving file: {} ({} bytes)", filename, file_size);
    
    // Read file data
    let mut file_data = vec![0u8; file_size];
    stream.read_exact(&mut file_data).await
        .context("Failed to read file data")?;
    
    // Generate unique filename if original already exists
    let unique_filename = generate_unique_filename(transfer_dir, filename).await;
    let file_path = transfer_dir.join(&unique_filename);
    
    info!("Saving file as: {}", unique_filename);
    
    // Save file to the received directory
    tokio::fs::write(&file_path, &file_data).await
        .with_context(|| format!("Failed to write file: {}", file_path.display()))?;
    
    Ok(unique_filename)
}

/// Calculate the total size of all files in a directory
async fn calculate_folder_size(folder_path: &PathBuf) -> Result<u64> {
    let mut total_size = 0u64;
    
    if !folder_path.exists() {
        return Ok(0);
    }
    
    let mut dir = fs::read_dir(folder_path).await
        .context("Failed to read directory")?;
    
    while let Some(entry) = dir.next_entry().await
        .context("Failed to read directory entry")? {
        
        let metadata = entry.metadata().await
            .context("Failed to get file metadata")?;
        
        if metadata.is_file() {
            total_size += metadata.len();
        }
    }
    
    Ok(total_size)
}

/// Check if file size and folder size limits are respected
async fn check_size_limits(config: &Config, file_size: u64, folder_path: &PathBuf) -> Result<()> {
    // Check individual file size limit
    if config.max_file_size > 0 && file_size > config.max_file_size {
        return Err(anyhow::anyhow!(
            "File size {} bytes exceeds maximum allowed file size {} bytes",
            file_size, config.max_file_size
        ));
    }
    
    // Check folder size limit (if enabled)
    if config.max_folder_size > 0 {
        let current_folder_size = calculate_folder_size(folder_path).await?;
        let new_total_size = current_folder_size + file_size;
        
        if new_total_size > config.max_folder_size {
            return Err(anyhow::anyhow!(
                "Adding file would result in folder size {} bytes, exceeding maximum allowed folder size {} bytes (current: {} bytes)",
                new_total_size, config.max_folder_size, current_folder_size
            ));
        }
    }
    
    Ok(())
} 