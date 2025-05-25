'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/header';
import Button from '../../../../components/button';

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

export default function EditDestinationPage() {
  const [form, setForm] = useState<DestinationForm>({
    name: '',
    ip: '',
    port: '',
    id: ''
  });
  const router = useRouter();
  const params = useParams();
  const destinationName = params.name as string;

  // Load destination data on component mount
  useEffect(() => {
    if (destinationName) {
      loadDestination(decodeURIComponent(destinationName));
    }
  }, [destinationName]);

  const loadDestination = (name: string) => {
    try {
      const saved = document.cookie
        .split('; ')
        .find(row => row.startsWith('destinations='))
        ?.split('=')[1];
      
      if (saved) {
        const destinations: Destination[] = JSON.parse(decodeURIComponent(saved));
        const destination = destinations.find(d => d.name === name);
        if (destination) {
          setForm({
            name: destination.name,
            ip: destination.ip,
            port: destination.port,
            id: destination.id
          });
        }
      }
    } catch (error) {
      console.error('Error loading destination:', error);
    }
  };

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

  const handleSave = () => {
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

      // Update the destination
      const updatedDestinations = destinations.map(dest => 
        dest.name === decodeURIComponent(destinationName)
          ? { ...form }
          : dest
      );

      // Save to cookies (expires in 365 days)
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      document.cookie = `destinations=${encodeURIComponent(JSON.stringify(updatedDestinations))}; expires=${expires.toUTCString()}; path=/`;

      // Navigate back to destinations page
      router.push('/destinations');

    } catch (error) {
      console.error('Error saving destination:', error);
    }
  };

  const handleCancel = () => {
    router.push('/destinations');
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
            Edit Destination
          </h1>
        </div>

        {/* Edit Form */}
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

          {/* Save and Cancel Buttons */}
          <div className="flex gap-2">
            <div className="w-1/2">
              <Button
                onClick={handleSave}
                disabled={!isFormValid()}
                fullWidth={true}
              >
                Save
              </Button>
            </div>
            <div className="w-1/2">
              <button
                onClick={handleCancel}
                style={{
                  backgroundColor: '#fca5a5',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.border = '1px solid #dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fca5a5';
                  e.currentTarget.style.color = '#dc2626';
                  e.currentTarget.style.border = '1px solid #dc2626';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
} 