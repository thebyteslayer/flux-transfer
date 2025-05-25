'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfigBox from '../components/box.module';
import Dropdown from '../components/dropdown.module';

export default function Home() {
  const router = useRouter();

  const dropdownOptions = [
    {
      label: 'Transfer',
      action: () => router.push('/transfer')
    },
    {
      label: 'Destinations',
      action: () => router.push('/destinations')
    },
    {
      label: 'Add Destination',
      action: () => router.push('/destinations/add')
    },
    {
      label: 'Documentation',
      action: () => alert('Documentation coming soon!')
    }
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-8">
            Flux Transfer
          </h1>
          
          {/* Configuration Info */}
          <div className="text-left mb-8">
            <p className="text-gray-700 mb-4">
              You can find your Transfer ID, your IP and your Port in:
            </p>
            <div className="space-y-2">
              <ConfigBox
                iconSrc="/windows.png"
                iconAlt="Windows"
                path="C:\Users\<username>\AppData\Roaming\.flux\transfer\transfer.toml"
              />
              <ConfigBox
                iconSrc="/linux.png"
                iconAlt="Linux"
                path="Coming Soon"
              />
              <ConfigBox
                iconSrc="/macos.png"
                iconAlt="MacOS"
                path="Coming Soon"
              />
            </div>
          </div>
          
                    {/* Dropdown Menu */}
          <Dropdown 
            buttonText="Options"
            options={dropdownOptions}
          />
        </div>
      </div>
    </div>
  );
}
