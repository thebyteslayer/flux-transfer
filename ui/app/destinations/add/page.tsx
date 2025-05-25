'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DestinationForm {
  name: string;
  ip: string;
  port: string;
  id: string;
}

interface Destination {
  name: string;
  ip: string;
  port: string;
  id: string;
}

export default function AddDestinationPage() {
  const [form, setForm] = useState<DestinationForm>({
    name: '',
    ip: '',
    port: '',
    id: ''
  });
  const [status, setStatus] = useState<string>('');
  const router = useRouter();

  const handleInputChange = (field: keyof DestinationForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return form.name.trim() !== '' && 
           form.ip.trim() !== '' && 
           form.port.trim() !== '' && 
           form.id.trim() !== '';
  };

  const saveDestination = () => {
    if (!isFormValid()) return;

    try {
      // Load existing destinations from cookies
      const existingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('flux_destinations='))
        ?.split('=')[1];
      
      let destinations: Destination[] = [];
      if (existingCookie) {
        destinations = JSON.parse(decodeURIComponent(existingCookie));
      }

      // Check if destination name already exists
      const existingIndex = destinations.findIndex(d => d.name === form.name);
      
      const newDestination: Destination = {
        name: form.name,
        ip: form.ip,
        port: form.port,
        id: form.id
      };

      if (existingIndex >= 0) {
        // Update existing destination
        destinations[existingIndex] = newDestination;
        setStatus('Destination updated successfully!');
      } else {
        // Add new destination
        destinations.push(newDestination);
        setStatus('Destination added successfully!');
      }

      // Save to cookies (expires in 365 days)
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      document.cookie = `flux_destinations=${encodeURIComponent(JSON.stringify(destinations))}; expires=${expires.toUTCString()}; path=/`;

      // Reset form
      setForm({
        name: '',
        ip: '',
        port: '',
        id: ''
      });

      // Redirect back to transfer page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving destination:', error);
      setStatus('Error saving destination. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/transfer"
            className="text-blue-600 hover:text-blue-700 underline mb-4 inline-block"
          >
            ← Back to Transfer
          </Link>
          <h1 className="text-3xl font-bold text-black mb-4">
            Add Destination
          </h1>
        </div>

        {/* Destination Form */}
        <div className="bg-white border border-gray-300 p-6">
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Server"
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
              />
            </div>

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

            {/* Add Destination Button */}
            <button
              onClick={saveDestination}
              disabled={!isFormValid()}
              className={`w-full py-3 font-medium text-white transition-colors duration-200 ${
                isFormValid()
                  ? 'bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700'
                  : 'bg-gray-400 border border-gray-400 cursor-not-allowed'
              }`}
            >
              Add Destination
            </button>

            {/* Status Message */}
            {status && (
              <div className={`p-3 border ${
                status.includes('successfully') 
                  ? 'border-green-300 bg-green-50 text-green-800' 
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 