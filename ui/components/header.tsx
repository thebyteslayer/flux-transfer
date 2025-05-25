import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const headerStyles = {
    '--header-left-spacing': '16px',
    '--header-right-spacing': '16px',
    '--header-height': '40px',
    '--header-top-spacing': '16px',
    '--header-border-radius': '15px',
  } as React.CSSProperties;

  return (
    <div 
      style={{
        ...headerStyles,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        marginTop: 'var(--header-top-spacing)',
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '24px',
          paddingRight: '24px',
          marginLeft: 'var(--header-left-spacing)',
          marginRight: 'var(--header-right-spacing)',
          height: 'var(--header-height)',
          borderRadius: 'var(--header-border-radius)',
        }}
      >
        {/* Logo on the left */}
        <Link href="/" style={{ cursor: 'pointer' }}>
          <img 
            src="/flux-light-transparent.png" 
            alt="Flux Transfer" 
            style={{ 
              height: '24px',
              width: 'auto'
            }} 
          />
        </Link>

        {/* Navigation in the center */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontSize: '14px',
          color: '#374151'
        }}>
          <span 
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/transfer')}
          >
            Transfer
          </span>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span 
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/destinations')}
          >
            Destinations
          </span>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span style={{ cursor: 'pointer' }}>Documentation</span>
        </div>

        {/* Empty div for spacing balance */}
        <div style={{ width: '24px' }}></div>
      </div>
    </div>
  );
}
