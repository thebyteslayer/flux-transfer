'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/header';
import Button from '../../../components/button';

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
        .find(row => row.startsWith('destinations='))
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
      } else {
        // Add new destination
        destinations.push(newDestination);
      }

      // Save to cookies (expires in 365 days)
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      document.cookie = `destinations=${encodeURIComponent(JSON.stringify(destinations))}; expires=${expires.toUTCString()}; path=/`;

      // Reset form
      setForm({
        name: '',
        ip: '',
        port: '',
        id: ''
      });

      // Redirect back to destinations page after 2 seconds
      setTimeout(() => {
        router.push('/destinations');
      }, 2000);

    } catch (error) {
      console.error('Error saving destination:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="p-8" style={{ paddingTop: '72px' }}>
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Add Destination
          </h1>
        </div>

        {/* Destination Form */}
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-1 border border-gray-300 focus:border-black outline-none rounded-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
            />
          </div>

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

          {/* Add Destination Button */}
          <div>
            <Button
              onClick={saveDestination}
              disabled={!isFormValid()}
              fullWidth={true}
            >
              Add Destination
            </Button>
          </div>


        </div>
        </div>
      </div>
    </div>
  );
} 