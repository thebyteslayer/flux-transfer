use anyhow::{Context, Result};
use std::{
    env,
    fs,
    path::PathBuf,
};

/// Creates all necessary directory structures for the application
pub fn create_directory_structure() -> Result<()> {
    let os = env::consts::OS;
    
    match os {
        "windows" => {
            create_windows_directories()?;
        }
        "linux" => {
            // Linux implementation placeholder - directory creation disabled for now
        }
        "macos" => {
            // macOS implementation placeholder - directory creation disabled for now
        }
        _ => {
            return Err(anyhow::anyhow!("Directory creation not supported for this OS"));
        }
    }
    
    Ok(())
}

/// Creates Windows-specific directory structure
fn create_windows_directories() -> Result<()> {
    // Create C:/transfer directory
    let c_transfer = PathBuf::from("C:/transfer");
    if !c_transfer.exists() {
        fs::create_dir_all(&c_transfer)
            .with_context(|| format!("Failed to create C:/transfer directory: {:?}", c_transfer))?;
    }
    
    // Create AppData/.transfer directory (for config file)
    let config_dir = get_config_directory()?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .with_context(|| format!("Failed to create config directory: {:?}", config_dir))?;
    }
    
    Ok(())
}

/// Returns the AppData config directory path
pub fn get_config_directory() -> Result<PathBuf> {
    let os = env::consts::OS;
    
    let config_path = match os {
        "windows" => {
            // Windows: %APPDATA%/Roaming/.transfer
            let appdata = env::var("APPDATA")
                .context("Failed to get APPDATA environment variable")?;
            PathBuf::from(appdata).join(".transfer")
        }
        "linux" => {
            // Linux: ~/.local/share/.transfer (to be implemented)
            // For now, we'll use a placeholder that won't be created
            PathBuf::from("/opt/transfer")
        }
        "macos" => {
            // macOS: ~/Library/Application Support/.transfer (to be implemented)
            // For now, we'll use a placeholder that won't be created
            PathBuf::from("/Users/Shared/transfer")
        }
        _ => {
            return Err(anyhow::anyhow!("Unsupported operating system: {}", os));
        }
    };
    
    Ok(config_path)
}

/// Ensures that a directory exists, creating it if necessary
/// This function handles both the base transfer directory and optional subfolders
pub async fn ensure_directory_exists(base_path: &str, subfolder: Option<&str>) -> Result<PathBuf> {
    let target_dir = if let Some(folder) = subfolder {
        // Use specified subfolder within the base directory
        PathBuf::from(base_path).join(folder)
    } else {
        // Use the base directory directly
        PathBuf::from(base_path)
    };
    
    // Create the directory if it doesn't exist
    if !target_dir.exists() {
        tokio::fs::create_dir_all(&target_dir).await
            .with_context(|| format!("Failed to create directory: {}", target_dir.display()))?;
    }
    
    Ok(target_dir)
} 