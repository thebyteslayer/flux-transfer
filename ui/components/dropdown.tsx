import { useState } from 'react';

interface DropdownOption {
  label: string;
  action: () => void;
}

interface DropdownProps {
  buttonText: string;
  options: DropdownOption[];
}

export default function Dropdown({ buttonText, options }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Button styled exactly like ConfigBox */}
      <div
        onClick={toggleDropdown}
        className="bg-white border border-gray-200 text-xs flex overflow-hidden transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
        style={{ 
          borderRadius: isOpen ? '8px 8px 0 0' : '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' 
        }}
      >
        <div className="py-1 px-2 flex items-center justify-center bg-white flex-1">
          <span className="text-gray-700">{buttonText}</span>
        </div>
      </div>
      
      {/* Dropdown menu styled like ConfigBox */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 z-10 min-w-full overflow-hidden"
          style={{ 
            borderRadius: '0 0 8px 8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' 
          }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option.action)}
              className="w-full py-1 px-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-xs flex items-center justify-center"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' 
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
