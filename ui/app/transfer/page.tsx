'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TransferForm {
  ip: string;
  port: string;
  id: string;
  file: File | null;
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
    file: null,
    folder: ''
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('Custom');
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
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
  };

  const handleDestinationChange = (destinationName: string) => {
    setSelectedDestination(destinationName);
    
    if (destinationName === 'Custom') {
      // Reset form when switching to custom
      setForm(prev => ({
        ip: '',
        port: '',
        id: '',
        file: prev.file, // Keep the file
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
          file: prev.file, // Keep the file
          folder: prev.folder // Keep the folder
        }));
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setForm(prev => ({
      ...prev,
      file
    }));
  };

  const isFormValid = () => {
    return form.ip.trim() !== '' && 
           form.port.trim() !== '' && 
           form.id.trim() !== '' && 
           form.file !== null;
  };

  const handleTransfer = async () => {
    if (!isFormValid() || !form.file) return;

    setIsTransferring(true);
    setTransferStatus('Connecting to server...');

    try {
      // Prepare form data for the transfer
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('ip', form.ip);
      formData.append('port', form.port);
      formData.append('transferId', form.id);
      if (form.folder.trim()) {
        formData.append('folder', form.folder.trim());
      }

      // Send file to bridge server which will handle TCP communication
      const response = await fetch('/api/transfer', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTransferStatus('Transfer completed successfully!');
      } else {
        setTransferStatus(`Transfer failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Transfer error:', error);
      setTransferStatus(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 underline mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-black mb-4">
            Send File
          </h1>
        </div>

        {/* Transfer Form */}
        <div className="bg-white border border-gray-300 p-6">
          <div className="space-y-4">
            {/* Destination Selector */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Destination
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
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
                  <label className="block text-sm font-medium text-black mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={form.ip}
                    onChange={(e) => handleInputChange('ip', e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Port Field */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={form.port}
                    onChange={(e) => handleInputChange('port', e.target.value)}
                    placeholder="8080"
                    className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                  />
                </div>

                {/* ID Field */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Transfer ID
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="transfer-123"
                    className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                  />
                </div>
              </>
            )}

            {/* File Field (always visible) */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.file?.name || ''}
                  readOnly
                  placeholder="No file selected"
                  className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 border border-blue-600 hover:border-blue-700 transition-colors duration-200"
                >
                  Browse
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Folder Field (always visible) */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Folder (Optional)
              </label>
              <input
                type="text"
                value={form.folder}
                onChange={(e) => handleInputChange('folder', e.target.value)}
                placeholder="Leave empty for default directory"
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                If specified, file will be saved in a subfolder within the configured transfer directory
              </p>
            </div>

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!isFormValid() || isTransferring}
              className={`w-full py-3 font-medium text-white transition-colors duration-200 ${
                isFormValid() && !isTransferring
                  ? 'bg-green-600 hover:bg-green-700 border border-green-600 hover:border-green-700'
                  : 'bg-gray-400 border border-gray-400 cursor-not-allowed'
              }`}
            >
              {isTransferring ? 'Transferring...' : 'Transfer'}
            </button>

            {/* Status Message */}
            {transferStatus && (
              <div className={`p-3 border ${
                transferStatus.includes('successfully') 
                  ? 'border-green-300 bg-green-50 text-green-800' 
                  : transferStatus.includes('failed') || transferStatus.includes('error')
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-blue-300 bg-blue-50 text-blue-800'
              }`}>
                {transferStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 