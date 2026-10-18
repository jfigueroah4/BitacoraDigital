import React from 'react';

interface LoginInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

export default function LoginInput({
  icon,
  rightIcon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  error = false,
  inputRef,
  ...restProps
}: LoginInputProps) {
  return (
    <div className="relative">
      {/* Left Icon */}
      {icon && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
          style={{
            color: error ? '#FF4D4F' : '#ff170f',
            transition: 'color 0.25s ease',
          }}
        >
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...restProps}
        style={{
          borderBottom: error ? '1.5px solid #FF4D4F' : '1px solid rgba(255, 23, 15, 0.9)',
          transition: 'border-bottom-color 0.25s ease, border-bottom-width 0.25s ease',
          paddingLeft: icon ? '26px' : '8px',
          paddingRight: rightIcon ? '36px' : '8px',
        }}
        className={`
          login-field
          w-full h-[38px]
          bg-transparent
          text-orange-50
          placeholder-orange-100/60
          font-poppins text-[11.5px] placeholder:text-[11px]
          outline-none
        `}
      />

      {/* Right Icon */}
      {rightIcon && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center p-1">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
