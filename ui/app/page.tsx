'use client';

import { useRouter } from 'next/navigation';
import Button from '../components/button';
import Header from '../components/header';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Main content */}
      <div className="p-8" style={{ paddingTop: '72px' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'black',
            marginBottom: '2rem'
          }}>
            Welcome to Transfer
          </h1>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button onClick={() => router.push('/transfer')}>
              Transfer
            </Button>
            <Button variant="secondary" onClick={() => console.log('Quick Start clicked')}>
              Quick Start
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
