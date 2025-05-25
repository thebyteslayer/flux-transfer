'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderWrapper from '../../components/header-wrapper';
import Button from '../../components/button';

interface Destination {
  name: string;
  ip: string;
  port: string;
  id: string;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const router = useRouter();

  // Load destinations from cookies on component mount
  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = () => {
    try {
      const saved = document.cookie
        .split('; ')
        .find(row => row.startsWith('flux_destinations='))
        ?.split('=')[1];
      
      if (saved) {
        const destinationsData = JSON.parse(decodeURIComponent(saved));
        setDestinations(destinationsData);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
    }
  };

  const saveDestinations = (updatedDestinations: Destination[]) => {
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      document.cookie = `flux_destinations=${encodeURIComponent(JSON.stringify(updatedDestinations))}; expires=${expires.toUTCString()}; path=/`;
      setDestinations(updatedDestinations);
    } catch (error) {
      console.error('Error saving destinations:', error);
    }
  };

  const handleEdit = (destination: Destination) => {
    router.push(`/destinations/edit/${encodeURIComponent(destination.name)}`);
  };

  const handleDelete = (destinationName: string) => {
    const updatedDestinations = destinations.filter(dest => dest.name !== destinationName);
    saveDestinations(updatedDestinations);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeaderWrapper />
      <div className="p-8" style={{ paddingTop: '72px' }}>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-black" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}>
              Destinations
            </h1>
            <Button onClick={() => router.push('/destinations/add')}>
              Add New Destination
            </Button>
          </div>
        </div>

        {/* Destinations List */}
        {destinations.length > 0 && (
          <div className="space-y-4">
            {destinations.map((destination) => (
              <div key={destination.name} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destination.name}
                    readOnly
                    className="flex-1 px-3 py-1 border border-gray-300 bg-gray-50 rounded-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                    }}
                  />
                  <Button onClick={() => handleEdit(destination)}>
                    Edit
                  </Button>
                  <button
                    onClick={() => handleDelete(destination.name)}
                    className="px-3 py-1 rounded-lg transition-colors duration-200"
                    style={{
                      backgroundColor: '#fca5a5',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
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
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
} 