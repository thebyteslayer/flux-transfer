use anyhow::{Context, Result};
use std::net::UdpSocket;

/// Determines the public-facing IP address using UDP ping method with 1.1.1.1
/// This method connects to Cloudflare's DNS (1.1.1.1) to determine which
/// local IP address would be used for external connections
pub fn get_public_ip() -> Result<String> {
    // Create a UDP socket
    let socket = UdpSocket::bind("0.0.0.0:0")
        .context("Failed to bind UDP socket")?;
    
    // Connect to Cloudflare DNS server (1.1.1.1:53)
    // This doesn't actually send data, just determines routing
    socket.connect("1.1.1.1:53")
        .context("Failed to connect to 1.1.1.1:53")?;
    
    // Get the local address that would be used to reach the destination
    let local_addr = socket.local_addr()
        .context("Failed to get local address")?;
    
    // Extract just the IP part (without port)
    let ip = local_addr.ip().to_string();
    
    Ok(ip)
}

/// Alternative method using different external services as fallback
pub fn get_public_ip_fallback() -> Result<String> {
    // Try connecting to Google DNS as fallback
    let socket = UdpSocket::bind("0.0.0.0:0")
        .context("Failed to bind UDP socket for fallback")?;
    
    socket.connect("8.8.8.8:53")
        .context("Failed to connect to 8.8.8.8:53")?;
    
    let local_addr = socket.local_addr()
        .context("Failed to get local address from fallback")?;
    
    let ip = local_addr.ip().to_string();
    
    Ok(ip)
}

/// Get public IP with fallback mechanism
pub fn detect_public_ip() -> Result<String> {
    // Try primary method first (1.1.1.1)
    match get_public_ip() {
        Ok(ip) => Ok(ip),
        Err(_) => {
            // Fallback to Google DNS
            get_public_ip_fallback()
                .context("Both primary and fallback IP detection methods failed")
        }
    }
}