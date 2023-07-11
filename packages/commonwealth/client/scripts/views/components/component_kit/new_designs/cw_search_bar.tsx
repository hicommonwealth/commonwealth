import React, { FC, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

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
  onClick: () => void;
};

const Tag: FC<TagProps> = ({ communityName, onClick }) => {
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
          onClick={() => {}}
        />
        <CWText type="b2" fontWeight="regular">
          {communityName}
        </CWText>
      </div>
      <div className="action" onClick={handleClick}>
        <X size={16} className="action" />
      </div>
    </div>
  );
};

export const CWSearchBar = (props: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [tag, setTag] = useState<boolean>(true);

  const { disabled, placeholder } = props;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleOnInput = (e) => {
    if (e.currentTarget.value?.length === 0) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
    }
  };

  return (
    <div
      className={getClasses<InputStyleProps & InputInternalStyleProps>(
        {
          isTyping,
        },
        ComponentType.SearchBar
      )}
    >
      <MagnifyingGlass className="magnifyingGlass" weight="regular" size={24} />
      {tag && <Tag communityName="1inch" onClick={() => setTag(false)} />}
      <div className="inputElement">
        <input
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onInput={handleOnInput}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
