import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  const baseStyle = {
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  };

  const primaryStyle = {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  };

  const secondaryStyle = {
    backgroundColor: '#27272a',
    color: '#e4e4e7',
  };

  return (
    <button style={{ ...baseStyle, ...(variant === 'primary' ? primaryStyle : secondaryStyle) }} {...props}>
      {children}
    </button>
  );
}
