
import React, { useState, useEffect, useRef } from 'react';

interface Option {
  id: string;
  name: string;
  details?: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string, name: string) => void;
  onAddNew?: () => void;
  placeholder?: string;
  required?: boolean;
  theme?: 'light' | 'dark';
  inputHeightClass?: string;
  allowCustom?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onAddNew,
  placeholder = 'Select...',
  required = false,
  theme = 'light',
  inputHeightClass = '',
  allowCustom = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal search term with external value (ID) -> Name
  useEffect(() => {
    const selectedOption = options.find((opt) => opt.id === value);
    if (selectedOption) {
      setSearchTerm(selectedOption.name);
    } else {
        // If allowCustom is true, and we have a value that doesn't match an option, show the value.
        if (allowCustom && value) {
             setSearchTerm(value);
        } else if (!value && !isOpen) {
             setSearchTerm('');
        }
    }
  }, [value, options, isOpen, allowCustom]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.details && opt.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When closing, revert input to selected value name to avoid confusion
  useEffect(() => {
      if (!isOpen) {
          const selectedOption = options.find((opt) => opt.id === value);
          if (selectedOption) {
              setSearchTerm(selectedOption.name);
          } else if (allowCustom && value) {
              setSearchTerm(value);
          } else {
              setSearchTerm('');
          }
      }
  }, [isOpen, value, options, allowCustom]);

  const handleSelect = (option: Option) => {
    onChange(option.id, option.name);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setSearchTerm(newVal);
      setIsOpen(true);
      if (allowCustom) {
          onChange(newVal, newVal);
      }
  };

  const labelColor = theme === 'dark' ? 'text-sky-300' : 'text-gray-700';
  const inputBg = theme === 'dark' ? 'bg-sky-900/50' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-sky-800' : 'border-gray-300';
  const inputText = theme === 'dark' ? 'text-sky-200' : 'text-gray-900';
  const dropdownBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const dropdownText = theme === 'dark' ? 'text-slate-200' : 'text-gray-900';
  const hoverColor = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100';

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className={`block text-sm font-semibold mb-1 ${labelColor}`}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
          <input
            type="text"
            className={`block w-full border rounded-md shadow-sm sm:text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBg} ${inputBorder} ${inputText} ${inputHeightClass}`}
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onClick={() => setIsOpen(true)}
            onFocus={(e) => e.target.select()} 
            required={required}
          />
          
          {/* Add New Button (Plus Icon) */}
          {onAddNew && (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation(); 
                    onAddNew();
                    setIsOpen(false);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none z-10 shadow-sm"
                title="Add New"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
          )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className={`absolute z-50 mt-1 w-full rounded-md shadow-lg border ${inputBorder} ${dropdownBg} max-h-60 overflow-y-auto`}>
            {filteredOptions.map((option) => (
            <li
                key={option.id}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${dropdownText} ${hoverColor}`}
                onMouseDown={(e) => {
                    // Prevent input blur to keep focus and allow selection to happen
                    e.preventDefault(); 
                    handleSelect(option);
                }}
            >
                <div className="flex flex-col">
                <span className="font-medium">{option.name}</span>
                {option.details && <span className="text-xs opacity-70">{option.details}</span>}
                </div>
            </li>
            ))}
        </ul>
      )}
      {isOpen && filteredOptions.length === 0 && searchTerm !== '' && !allowCustom && (
           <ul className={`absolute z-50 mt-1 w-full rounded-md shadow-lg border ${inputBorder} ${dropdownBg}`}>
                <li className={`py-2 pl-3 pr-9 ${dropdownText} opacity-50`}>No results found</li>
           </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
