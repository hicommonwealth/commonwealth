import React, { FC, ChangeEvent, useState, useEffect } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import useAutocomplete from '@mui/base/useAutocomplete';

import { ComponentType } from '../types';
import { CWTag } from './CWTag';

import 'components/component_kit/new_designs/CWSearchBar.scss';
import { IconName } from '../cw_icons/cw_icon_lookup';
import { getClasses } from '../helpers';
import { ValidationStatus } from '../cw_validation_text';

type BaseSearchBarProps = {
  autoComplete?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconLeft?: IconName;
  iconLeftonClick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string | React.ReactNode;
  maxLength?: number;
  name?: string;
  onInput?: (e) => void;
  onenterkey?: (e) => void;
  onClick?: (e) => void;
  placeholder?: string;
  tabIndex?: number;
  manualStatusMessage?: string;
  manualValidationStatus?: ValidationStatus;
};

type InputStyleProps = {
  inputClassName?: string;
  disabled?: boolean;
};

type InputInternalStyleProps = {
  hasLeftIcon?: boolean;
  isTyping?: boolean;
};

type SearchBarProps = BaseSearchBarProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

const communities = [
  'Altitude',
  'Terra Classic',
  'Osmosis',
  'Qwoyn Network',
  '1inch',
  'Stargate Finance',
  'Timeless',
  'Terra Agora',
  'Injective',
  'Juno',
  'Common',
];

export const CWSearchBar: FC<SearchBarProps> = ({ disabled, placeholder }) => {
  const [value, setValue] = useState<string>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [communityName, setCommunityName] = useState<string>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleOnInput = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.currentTarget.value?.length === 0) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
    }
  };

  const handleOnKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      // TODO remove tag when backspace key pressed
    }
  };

  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
  } = useAutocomplete({
    options: communities,
    value,
    onChange: (event: any, newValue) => {
      setCommunityName(newValue);
      setValue('');
    },
    getOptionLabel: (option) => option,
  });

  return (
    <div className="container" onBlur={() => setIsTyping(false)}>
      <div
        className={getClasses<InputStyleProps & InputInternalStyleProps>(
          {
            isTyping,
            disabled,
          },
          ComponentType.Searchbar
        )}
      >
        <MagnifyingGlass
          className={getClasses(
            { magnifyingGlass: true },
            ComponentType.Searchbar
          )}
          weight="regular"
          size={24}
        />
        {communityName && (
          <CWTag
            communityName={communityName}
            onClick={() => setCommunityName(null)}
          />
        )}
        <div
          className={getClasses(
            { inputElement: true },
            ComponentType.Searchbar
          )}
          {...getRootProps()}
        >
          <input
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onInput={handleOnInput}
            onKeyDown={handleOnKeyDown}
            disabled={disabled}
            {...getInputProps()}
          />
        </div>
      </div>
      {groupedOptions.length > 0 && (
        <ul className="listBox" {...getListboxProps()}>
          {(groupedOptions as typeof communities).map((option, index) => (
            <li className="option" {...getOptionProps({ option, index })}>
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
