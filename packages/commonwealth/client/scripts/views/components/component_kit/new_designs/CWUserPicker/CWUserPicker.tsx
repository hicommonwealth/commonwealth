import React, { useEffect, useMemo, useRef, useState } from 'react';
import useSearchProfilesQuery from 'state/api/profiles/searchProfiles';
import { useDebounceValue } from 'usehooks-ts';
import { CWLabel } from '../../cw_label';
import './CWUserPicker.scss';

export type CWUserPickerOption = {
  value: string;
  label: string;
  avatar_url?: string;
  user_id: number;
  profile_name?: string;
};

export type CWUserPickerProps = {
  value?: string | number;
  onChange: (user: CWUserPickerOption | null) => void;
  placeholder?: string;
  communityId?: string;
  label?: string;
};

export const CWUserPicker: React.FC<CWUserPickerProps> = ({
  value,
  onChange,
  placeholder = 'Search user by name or ID...',
  communityId = '',
  label = 'User',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [debouncedInput] = useDebounceValue(inputValue, 400);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = useSearchProfilesQuery({
    communityId,
    searchTerm: debouncedInput,
    limit: 10,
    enabled: !!debouncedInput,
  });

  const options: CWUserPickerOption[] = useMemo(() => {
    if (!searchResults?.pages?.length) return [];
    return searchResults.pages[0].results.map((user) => ({
      label: `${user.profile_name || 'Unnamed'} (ID: ${user.user_id})`,
      value: String(user.user_id),
      avatar_url: user.avatar_url || undefined,
      user_id: user.user_id,
      profile_name: user.profile_name || undefined,
    }));
  }, [searchResults]);

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === String(value)) || null;
  }, [options, value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="CWUserPicker">
      {label && <CWLabel label={label} />}
      <div
        className="CWUserPicker__control"
        style={{ position: 'relative', width: '100%' }}
      >
        <input
          ref={inputRef}
          className={
            'CWUserPicker__input' +
            (selectedOption && !(dropdownOpen || focused)
              ? ' CWUserPicker__input--overlay'
              : '')
          }
          value={
            dropdownOpen || focused ? inputValue : selectedOption?.label || ''
          }
          onChange={(e) => {
            setInputValue(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => {
            setDropdownOpen(true);
            setFocused(true);
            if (!inputValue && selectedOption) {
              setInputValue(selectedOption.label);
            }
          }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ width: '100%' }}
        />
        {selectedOption && !(dropdownOpen || focused) && (
          <div className="CWUserPicker__selected-overlay">
            <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--avatar">
              {selectedOption.avatar_url && (
                <img
                  src={selectedOption.avatar_url}
                  alt="avatar"
                  style={{ width: 24, height: 24, borderRadius: '50%' }}
                />
              )}
            </span>
            <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--name">
              {selectedOption.profile_name || 'Unnamed'}
            </span>
            <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--id">
              {selectedOption.user_id}
            </span>
          </div>
        )}
        <span
          className="CWUserPicker__arrow"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M5 8l5 5 5-5"
              stroke="#888"
              strokeWidth="2"
              fill="none"
              fillRule="evenodd"
            />
          </svg>
        </span>
        {dropdownOpen && options.length > 0 && (
          <div className="CWUserPicker__dropdown-table">
            <div className="CWUserPicker__dropdown-header">
              <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--avatar"></span>
              <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--name">
                Name
              </span>
              <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--id">
                ID
              </span>
            </div>
            {options.map((option) => (
              <div
                key={option.value}
                className="CWUserPicker__dropdown-row"
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDropdownOpen(false);
                  setFocused(false);
                  inputRef.current?.blur();
                  onChange(option);
                }}
              >
                <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--avatar">
                  {option.avatar_url && (
                    <img
                      src={option.avatar_url}
                      alt="avatar"
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                  )}
                </span>
                <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--name">
                  {option.profile_name || 'Unnamed'}
                </span>
                <span className="CWUserPicker__dropdown-col CWUserPicker__dropdown-col--id">
                  {option.user_id}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CWUserPicker;
