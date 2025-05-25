'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Destination {
  name: string;
  ip: string;
  port: string;
  id: string;
}

interface EditForm {
  name: string;
  ip: string;
  port: string;
  id: string;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [editingDestination, setEditingDestination] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    ip: '',
    port: '',
    id: ''
  });
  const [status, setStatus] = useState<string>('');
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
      setStatus('Error loading destinations');
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
      setStatus('Error saving destinations');
    }
  };

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination.name);
    setEditForm({
      name: destination.name,
      ip: destination.ip,
      port: destination.port,
      id: destination.id
    });
    setStatus('');
  };

  const handleCancelEdit = () => {
    setEditingDestination(null);
    setEditForm({
      name: '',
      ip: '',
      port: '',
      id: ''
    });
    setStatus('');
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.ip.trim() || !editForm.port.trim() || !editForm.id.trim()) {
      setStatus('All fields are required');
      return;
    }

    const updatedDestinations = destinations.map(dest => 
      dest.name === editingDestination 
        ? { ...editForm }
        : dest
    );

    saveDestinations(updatedDestinations);
    setEditingDestination(null);
    setEditForm({
      name: '',
      ip: '',
      port: '',
      id: ''
    });
    setStatus('Destination updated successfully!');
    
    // Clear status after 3 seconds
    setTimeout(() => setStatus(''), 3000);
  };

  const handleDelete = (destinationName: string) => {
    if (confirm(`Are you sure you want to delete "${destinationName}"?`)) {
      const updatedDestinations = destinations.filter(dest => dest.name !== destinationName);
      saveDestinations(updatedDestinations);
      setStatus('Destination deleted successfully!');
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleInputChange = (field: keyof EditForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 underline mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-black">
              Destinations
            </h1>
            <Link
              href="/destinations/add"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 border border-blue-600 hover:border-blue-700 transition-colors duration-200"
            >
              Add New Destination
            </Link>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mb-6 p-3 border ${
            status.includes('successfully') || status.includes('deleted')
              ? 'border-green-300 bg-green-50 text-green-800' 
              : 'border-red-300 bg-red-50 text-red-800'
          }`}>
            {status}
          </div>
        )}

        {/* Destinations List */}
        {destinations.length === 0 ? (
          <div className="bg-white border border-gray-300 p-6 text-center">
            <p className="text-gray-600 mb-4">No destinations saved yet.</p>
            <Link
              href="/destinations/add"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Add your first destination
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {destinations.map((destination) => (
              <div key={destination.name} className="bg-white border border-gray-300 p-6">
                {editingDestination === destination.name ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          IP Address
                        </label>
                        <input
                          type="text"
                          value={editForm.ip}
                          onChange={(e) => handleInputChange('ip', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Port
                        </label>
                        <input
                          type="text"
                          value={editForm.port}
                          onChange={(e) => handleInputChange('port', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Transfer ID
                        </label>
                        <input
                          type="text"
                          value={editForm.id}
                          onChange={(e) => handleInputChange('id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 border border-green-600 hover:border-green-700 transition-colors duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 border border-gray-600 hover:border-gray-700 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-black">
                        {destination.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(destination)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm border border-blue-600 hover:border-blue-700 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(destination.name)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm border border-red-600 hover:border-red-700 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">IP Address:</span>
                        <p className="text-black">{destination.ip}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Port:</span>
                        <p className="text-black">{destination.port}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Transfer ID:</span>
                        <p className="text-black">{destination.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 