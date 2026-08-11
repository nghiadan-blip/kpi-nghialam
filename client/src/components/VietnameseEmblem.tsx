import React from 'react';

interface Props {
  className?: string;
  size?: number;
  alt?: string;
}

export const VietnameseEmblem: React.FC<Props> = ({
  className = 'w-10 h-10',
  size,
  alt = 'Quốc huy nước Cộng hòa xã hội chủ nghĩa Việt Nam',
}) => {
  return (
    <img
      src="/quoc-huy.svg"
      alt={alt}
      width={size}
      height={size}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
      className={`inline-block object-contain drop-shadow-md flex-shrink-0 select-none ${className}`}
      loading="eager"
    />
  );
};
