import Image from 'next/image';

interface ConfigBoxProps {
  iconSrc: string;
  iconAlt: string;
  path: string;
}

export default function ConfigBox({ iconSrc, iconAlt, path }: ConfigBoxProps) {
  return (
    <div 
      className="bg-white border border-gray-200 text-xs flex overflow-hidden" 
      style={{ 
        borderRadius: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' 
      }}
    >
      <div className="py-1 px-2 flex items-center justify-center bg-white min-w-[2.5rem]">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={18}
          height={18}
          className="object-contain"
        />
      </div>
      <div className="border-l border-gray-300 self-stretch"></div>
      <div 
        className="text-gray-700 py-1 px-2 flex-1 flex items-center justify-center break-all" 
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' 
        }}
      >
        {path}
      </div>
    </div>
  );
}
