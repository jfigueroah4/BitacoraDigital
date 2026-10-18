import React from 'react';

interface LoginButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function LoginButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: LoginButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full h-[44px]
        bg-transparent
        border-2 border-[#ff170f]
        text-[#ff5b55]
        font-poppins font-semibold text-base
        rounded-full
        transition-all duration-150
        hover:bg-[#ff170f]
        hover:text-white
        hover:scale-[1.03]
        hover:shadow-lg
        hover:shadow-red-950/50
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        flex items-center justify-center
      `}
    >
      {children}
    </button>
  );
}
