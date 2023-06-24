import React, { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { ComponentType } from './../types';

import 'components/component_kit/cw_search_bar.scss';
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
  // darkMode?: boolean;
  disabled?: boolean;
  // size?: TextInputSize;
  // validationStatus?: ValidationStatus;
  displayOnly?: boolean;
};

type InputInternalStyleProps = {
  hasLeftIcon?: boolean;
  // isTyping?: boolean;
};

type SearchBarProps = BaseSearchBarProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

export const CWSearchBar = (props: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const {
    autoComplete = 'off',
    autoFocus,
    containerClassName,
    defaultValue,
    value,
    disabled,
    iconLeftonClick,
    inputClassName,
    inputValidationFn,
    label,
    maxLength,
    name,
    onInput,
    onenterkey,
    onClick,
    placeholder,
    tabIndex,
    displayOnly,
    manualStatusMessage = '',
    manualValidationStatus = '',
  } = props;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <div className="input-and-icon-container">
      <div className="magnifyingGlass">
        <MagnifyingGlass color="#A09DA1" weight="regular" size={24} />
      </div>
      <input
        className={getClasses<InputStyleProps & InputInternalStyleProps>(
          {
            disabled,
            // hasLeftIcon: !!iconLeft,
            inputClassName,
          },
          ComponentType.SearchBar
        )}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
      />
    </div>
  );
};
