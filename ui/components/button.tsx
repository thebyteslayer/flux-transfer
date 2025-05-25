import { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  borderRadius?: number;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function Button({ children, onClick, borderRadius = 6, variant = 'primary', disabled = false, fullWidth = false }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getColors = () => {
    if (variant === 'secondary') {
      return {
        backgroundColor: isHovered ? 'black' : 'white',
        color: isHovered ? 'white' : 'black',
      };
    }
    return {
      backgroundColor: isHovered ? 'white' : 'black',
      color: isHovered ? 'black' : 'white',
    };
  };

  const colors = getColors();

  const buttonStyle = {
    backgroundColor: disabled ? '#fca5a5' : colors.backgroundColor,
    color: disabled ? '#dc2626' : colors.color,
    border: disabled ? '1px solid #dc2626' : '1px solid #6b7280',
    padding: '4px 12px',
    borderRadius: `8px`,
    fontSize: '14px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    width: fullWidth ? '100%' : 'auto',
  };

  return (
    <button
      style={buttonStyle}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
