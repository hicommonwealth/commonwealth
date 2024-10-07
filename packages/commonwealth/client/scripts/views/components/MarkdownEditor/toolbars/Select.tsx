import React, { useEffect, useRef, useState } from 'react';

type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
};

const Select: React.FC<SelectProps> = ({ options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={selectRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px',
          border: '1px solid #ccc',
          cursor: 'pointer',
          backgroundColor: '#fff',
          width: '200px',
        }}
      >
        {selectedOption
          ? selectedOption.label
          : placeholder || 'Select an option'}
      </div>
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            listStyle: 'none',
            padding: '0',
            margin: '0',
            width: '100%',
            zIndex: 10,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor:
                  selectedOption?.value === option.value ? '#f0f0f0' : '#fff',
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
