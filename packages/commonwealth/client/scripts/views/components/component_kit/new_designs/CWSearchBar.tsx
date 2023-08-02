import React, { FC, ChangeEvent, useState, useEffect } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import useAutocomplete from '@mui/base/useAutocomplete';

import { ComponentType } from '../types';
import { CWTag } from './CWTag';
import { IconName } from '../cw_icons/cw_icon_lookup';
import { getClasses } from '../helpers';
import { ValidationStatus } from '../cw_validation_text';
import ChainInfo from '../../../../models/ChainInfo';
import { CWText } from '../cw_text';
import { CWCommunityAvatar } from '../cw_community_avatar';

import 'components/component_kit/new_designs/CWSearchBar.scss';

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
  options?: ChainInfo[];
};

type InputStyleProps = {
  inputClassName?: string;
  disabled?: boolean;
};

type InputInternalStyleProps = {
  hasLeftIcon?: boolean;
};

type SearchBarProps = BaseSearchBarProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

export const CWSearchBar: FC<SearchBarProps> = ({
  disabled,
  placeholder,
  options,
}) => {
  const [value, setValue] = useState<string>('');
  const [communities, setCommunities] = useState([]);
  const [id, setId] = useState(null);

  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
  } = useAutocomplete({
    options: communities,
    onChange: (event: any, chain) => {
      setValue('');
      setId(chain.id);
    },
    getOptionLabel: (option) => option.name,
  });

  const handleOnInput = (e: ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);

  const handleOnKeyDown = (e: any) => {
    if (e.key === 'Backspace' && value.length === 0) {
      setId(null);
    }
  };

  const getChain = (chainId: string): ChainInfo =>
    options.find((c) => c.id === chainId);

  const sortByName = (a: any, b: any) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();

    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  };

  useEffect(() => {
    const list = [];
    for (let i = 0; i < options.length; i++) {
      list.push(options[i]);
    }
    list.sort(sortByName);
    setCommunities([...list]);
  }, [options]);

  return (
    <div className="container">
      <div
        className={getClasses<InputStyleProps & InputInternalStyleProps>(
          {
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
        {id && <CWTag community={getChain(id)} onClick={() => setId(null)} />}
        <div
          className={getClasses(
            { inputElement: true },
            ComponentType.Searchbar
          )}
          {...getRootProps()}
        >
          <input
            placeholder={placeholder}
            onInput={handleOnInput}
            onKeyDown={handleOnKeyDown}
            disabled={disabled}
            {...getInputProps()}
            value={value}
          />
        </div>
      </div>
      {groupedOptions.length > 0 ? (
        <ul className="listBox" {...getListboxProps()}>
          {(groupedOptions as typeof communities).map((option, index) => (
            <li
              key={option.id}
              className="option"
              {...getOptionProps({ option, index })}
            >
              <CWCommunityAvatar size="medium" community={option} />
              {option.name}
            </li>
          ))}
        </ul>
      ) : value.length > 0 ? (
        <div className="noResults">
          <CWText type="b2">No results found</CWText>
        </div>
      ) : null}
    </div>
  );
};
