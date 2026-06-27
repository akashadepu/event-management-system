import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', light = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center py-2" id="spinner-container">
      <div
        className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin ${
          light ? 'border-white' : 'border-purple-600'
        }`}
        id="loading-spinner-element"
      />
    </div>
  );
};
