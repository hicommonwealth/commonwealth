import React, { FC, ChangeEvent, useState, useEffect } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import useAutocomplete from '@mui/base/useAutocomplete';

import app from 'state';
import ChainInfo from 'client/scripts/models/ChainInfo';
import { ComponentType } from './../types';

import 'components/component_kit/new_designs/cw_search_bar.scss';
import { IconName } from '../cw_icons/cw_icon_lookup';
import { getClasses } from '../helpers';
import { ValidationStatus } from '../cw_validation_text';
import { CWText } from '../cw_text';
import { CWCommunityAvatar } from '../cw_community_avatar';

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

type TagProps = {
  communityName: string;
  disabled?: boolean;
  onClick: () => void;
};

const communities: any = [
  ...app.config.chains
    .getAll()
    // .map((c) => {c.id, c.name})
    .map((c) => c.name)
    .sort(),
];
// const communities = [
//   'Altitude',
//   'Terra Classic',
//   'Osmosis',
//   'Qwoyn Network',
//   '1inch',
//   'Stargate Finance',
//   'Timeless',
//   'Terra Agora',
//   'Injective',
//   'Juno',
//   'Common',
// ];

const Tag: FC<TagProps> = ({ communityName, disabled, onClick }) => {
  const handleClick = () => {
    console.log('clicked!');
    onClick();
  };

  return (
    <div className="tag">
      <div className="name">
        <CWCommunityAvatar
          size="small"
          // community={app.chain.meta}
          community={null}
          onClick={() => console.log('clicked!')}
        />
        <CWText type="b2" fontWeight="regular">
          {communityName}
        </CWText>
      </div>
      <div
        className={getClasses({
          action: true,
          disabled,
        })}
        onClick={handleClick}
      >
        <X size={16} className="action" />
      </div>
    </div>
  );
};

export const CWSearchBar: FC<SearchBarProps> = ({ disabled, placeholder }) => {
  const [value, setValue] = useState<string>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [communityName, setCommunityName] = useState<string>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);

  const handleOnInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.value?.length === 0) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
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

  useEffect(() => {
    console.log('chains:', app.config.chains.getAll());
  }, []);

  return (
    <div className="container">
      <div
        className={getClasses<InputStyleProps & InputInternalStyleProps>(
          {
            isTyping,
            disabled,
          },
          ComponentType.SearchBar
        )}
      >
        <MagnifyingGlass
          className="magnifyingGlass"
          weight="regular"
          size={24}
        />
        {communityName && (
          <Tag
            communityName={communityName}
            onClick={() => setCommunityName(null)}
          />
        )}
        <div className="inputElement" {...getRootProps()}>
          <input
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onInput={handleOnInput}
            disabled={disabled}
            {...getInputProps()}
          />
        </div>
      </div>
      {groupedOptions.length > 0 && (
        <div className="listBox">
          <ul {...getListboxProps()}>
            {(groupedOptions as typeof communities).map((option, index) => (
              <li className="option" {...getOptionProps({ option, index })}>
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
