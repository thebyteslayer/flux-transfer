use anyhow::{Context, Result};
use rand::{distributions::Alphanumeric, Rng};
use serde_derive::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
};
use toml;
use crate::structure;

// Configuration structure that maps to transfer.toml
#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    #[serde(default = "default_bind")]
    pub bind: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "generate_transfer_id")]
    pub transfer_id: String,
    #[serde(default = "default_folder")]
    pub folder: String,
    #[serde(default = "default_max_folder_size")]
    pub max_folder_size: u64,
    #[serde(default = "default_max_file_size")]
    pub max_file_size: u64,
}

/// Default function for bind field
fn default_bind() -> String {
    "127.0.0.1".to_string()
}

/// Default function for port field
fn default_port() -> u16 {
    1000
}

/// Default function for folder field
fn default_folder() -> String {
    "C:/transfer".to_string()
}

/// Default function for max_folder_size field (0 = no limit)
fn default_max_folder_size() -> u64 {
    0
}

/// Default function for max_file_size field (0 = no limit)
fn default_max_file_size() -> u64 {
    0
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bind: default_bind(),
            port: default_port(),
            transfer_id: generate_transfer_id(),
            folder: default_folder(),
            max_folder_size: default_max_folder_size(),
            max_file_size: default_max_file_size(),
        }
    }
}

impl Config {
    /// Loads config from transfer.toml if exists, or creates a new one
    pub fn load_or_create() -> Result<Self> {
        // Get the AppData config directory path
        let config_dir = structure::get_config_directory()?;
        let config_path = config_dir.join("transfer.toml");
        
        let mut config = if config_path.exists() {
            let content = fs::read_to_string(&config_path)
                .context("Failed to read transfer.toml")?;
                
            // Try to parse the existing config, if it fails, create a new default config
            match toml::from_str::<Config>(&content) {
                Ok(parsed_config) => {
                    // Successfully parsed, use it
                    parsed_config
                }
                Err(_) => {
                    // Failed to parse, create new default config
                    Config::default()
                }
            }
        } else {
            // No config file exists, create default
            Config::default()
        };
        
        // Update bind with detected public IP on every startup
        if let Ok(public_ip) = crate::ip::detect_public_ip() {
            config.bind = public_ip;
        }
        
        // Always save the config to ensure it's up to date and any missing fields are added
        config.save_to_path(&config_path)?;
            
        Ok(config)
    }

    /// Helper method to save config to a specific path
    fn save_to_path(&self, path: &Path) -> Result<()> {
        let toml_content = toml::to_string(self)
            .context("Failed to serialize config to TOML")?;
            
        let mut file = File::create(path)
            .context("Failed to create transfer.toml")?;
            
        file.write_all(toml_content.as_bytes())
            .context("Failed to write to transfer.toml")?;
            
        Ok(())
    }
}

/// Helper function to generate transfer ID in format xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx
fn generate_transfer_id() -> String {
    let mut rng = rand::thread_rng();
    
    let sections: Vec<String> = (0..4)
        .map(|_| {
            (0..7)
                .map(|_| {
                    // Generate random alphanumeric characters (0-9, a-z)
                    let rand_char = rng.sample(Alphanumeric);
                    char::from(rand_char).to_lowercase().next().unwrap()
                })
                .collect::<String>()
        })
        .collect();
    
    sections.join("-")
} 