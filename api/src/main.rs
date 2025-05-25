mod config;
mod ip;
mod api;
mod structure;

use anyhow::{Context, Result};
use log::info;
use crate::config::Config;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::init();
    
    // Load or create configuration (this will also detect and update public IP)
    let config = Config::load_or_create()
        .context("Failed to load or create configuration")?;
    
    // Create config directory structure (for the config file itself)
    structure::create_directory_structure()
        .context("Failed to create config directory structure")?;
    
    // Create the configured transfer directory
    let transfer_dir = std::path::PathBuf::from(&config.folder);
    if !transfer_dir.exists() {
        std::fs::create_dir_all(&transfer_dir)
            .with_context(|| format!("Failed to create transfer directory: {}", transfer_dir.display()))?;
    }
    
    println!("Transfer running on {}:{}", config.bind, config.port);
    info!("Transfer ID: {}", config.transfer_id);
    
    // Start the transfer protocol server
    api::start_tcp_server(&config.bind, config.port).await?;
    
    Ok(())
} 