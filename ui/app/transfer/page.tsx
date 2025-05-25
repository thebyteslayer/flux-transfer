'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderWrapper from '../../components/header-wrapper';
import Button from '../../components/button';

interface TransferForm {
  ip: string;
  port: string;
  id: string;
  files: File[];
  folder: string;
}

interface Destination {
  name: string;
  ip: string;
  port: string;
  id: string;
}

export default function TransferPage() {
  const [form, setForm] = useState<TransferForm>({
    ip: '',
    port: '',
    id: '',
    files: [],
    folder: ''
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [transferProgress, setTransferProgress] = useState({ completed: 0, total: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>('Custom');
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  const [selectFolders, setSelectFolders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load destinations from cookies on component mount
  useEffect(() => {
    const loadDestinations = () => {
      try {
        const saved = document.cookie
          .split('; ')
          .find(row => row.startsWith('flux_destinations='))
          ?.split('=')[1];
        
        if (saved) {
          const destinations = JSON.parse(decodeURIComponent(saved));
          setSavedDestinations(destinations);
        }
      } catch (error) {
        console.error('Error loading destinations:', error);
      }
    };

    loadDestinations();
  }, []);

  const handleInputChange = (field: keyof TransferForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset transferred state when form changes
    setIsTransferred(false);
    setShowProgress(false);
  };

  const handleDestinationChange = (destinationName: string) => {
    setSelectedDestination(destinationName);
    
    if (destinationName === 'Custom') {
      // Reset form when switching to custom
      setForm(prev => ({
        ip: '',
        port: '',
        id: '',
        files: prev.files, // Keep the files
        folder: prev.folder // Keep the folder
      }));
    } else {
      // Load saved destination data
      const destination = savedDestinations.find(d => d.name === destinationName);
      if (destination) {
        setForm(prev => ({
          ip: destination.ip,
          port: destination.port,
          id: destination.id,
          files: prev.files, // Keep the files
          folder: prev.folder // Keep the folder
        }));
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setForm(prev => ({
      ...prev,
      files
    }));
    // Reset transferred state when files change
    setIsTransferred(false);
    setShowProgress(false);
  };

  const isFormValid = () => {
    return form.ip.trim() !== '' && 
           form.port.trim() !== '' && 
           form.id.trim() !== '' && 
           form.files.length > 0;
  };

  const handleTransfer = async () => {
    if (!isFormValid() || form.files.length === 0) return;

    setIsTransferring(true);
    setShowProgress(true);
    setTransferProgress({ completed: 0, total: form.files.length });

    try {
      let successfulTransfers = 0;
      
      // Transfer files one by one to update progress in real-time
      for (let i = 0; i < form.files.length; i++) {
        const file = form.files[i];
        
        // Prepare form data for single file transfer
        const formData = new FormData();
        formData.append('file_0', file);
        formData.append('fileCount', '1');
        formData.append('ip', form.ip);
        formData.append('port', form.port);
        formData.append('transferId', form.id);
        if (form.folder.trim()) {
          formData.append('folder', form.folder.trim());
        }

        try {
          // Send single file to bridge server
          const response = await fetch('/api/transfer', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success) {
            successfulTransfers++;
          } else {
            console.error(`Transfer failed for file ${file.name}:`, result.message || result.error);
          }
          
          // Update progress after each file
          setTransferProgress({ completed: successfulTransfers, total: form.files.length });
          
        } catch (error) {
          console.error(`Error transferring file ${file.name}:`, error);
          // Continue with next file even if this one failed
        }
      }
      
      // Only navigate back to homepage if all transfers were successful
      if (successfulTransfers === form.files.length) {
        setIsTransferred(true);
        // Wait 2 seconds to show the "Transferred" state before navigating
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        // Handle partial failure - stay on page
        console.error(`Only ${successfulTransfers}/${form.files.length} files transferred successfully`);
      }

    } catch (error) {
      console.error('Transfer error:', error);
      // Show current progress on error
      setTransferProgress(prev => ({ ...prev }));
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HeaderWrapper />
      <div className="p-8" style={{ paddingTop: '72px' }}>
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Transfer
          </h1>
        </div>

        {/* Transfer Form */}
        <div className="space-y-4">
          {/* Destination Selector */}
          <div>
            <select
              value={selectedDestination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
            >
              <option value="Custom">Custom</option>
              {savedDestinations.map((dest) => (
                <option key={dest.name} value={dest.name}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Form Fields */}
          {selectedDestination === 'Custom' && (
            <>
              {/* IP Field */}
              <div>
                <input
                  type="text"
                  value={form.ip}
                  onChange={(e) => handleInputChange('ip', e.target.value)}
                  placeholder="IP Address"
                  className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                  }}
                />
              </div>

              {/* Port Field */}
              <div>
                <input
                  type="text"
                  value={form.port}
                  onChange={(e) => handleInputChange('port', e.target.value)}
                  placeholder="Port"
                  className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                  }}
                />
              </div>

              {/* ID Field */}
              <div>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="Transfer ID"
                  className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                  }}
                />
              </div>
            </>
          )}

          {/* File/Folder Selection */}
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.files.length === 0 ? '' : form.files.length === 1 ? form.files[0].name : `${form.files.length} files selected`}
                readOnly
                placeholder="No files selected"
                className="w-1/2 px-3 py-1 border border-gray-300 bg-gray-50 rounded-lg"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                }}
              />
              <button
                onClick={handleFileSelect}
                className="w-1/2 px-3 py-1 border border-gray-300 bg-black hover:bg-white text-white hover:text-black rounded-lg transition-colors duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Browse
              </button>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Folder Field (always visible) */}
          <div>
            <input
              type="text"
              value={form.folder}
              onChange={(e) => handleInputChange('folder', e.target.value)}
              placeholder="Folder (Optional)"
              className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
            />
          </div>

          {/* Transfer Button */}
          <div>
            <button
              onClick={handleTransfer}
              disabled={!isFormValid() || isTransferring || isTransferred}
              style={{
                width: '100%',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (!isFormValid() || isTransferring || isTransferred) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                backgroundColor: isTransferred ? '#bbf7d0' : isTransferring ? '#bfdbfe' : (!isFormValid() ? '#fca5a5' : 'black'),
                color: isTransferred ? '#065f46' : isTransferring ? '#1e40af' : (!isFormValid() ? '#dc2626' : 'white'),
                border: isTransferred ? '1px solid #065f46' : isTransferring ? '1px solid #1e40af' : (!isFormValid() ? '1px solid #dc2626' : '1px solid #6b7280'),
              }}
            >
              {isTransferred ? 'Transferred' : isTransferring ? 'Transferring...' : 'Transfer'}
            </button>
            

            
            {/* Transfer Progress */}
            {showProgress && (
              <div style={{
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#6b7280',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}>
                {transferProgress.completed}/{transferProgress.total} files transferred
              </div>
            )}
          </div>


        </div>
        </div>
      </div>
    </div>
  );
} 