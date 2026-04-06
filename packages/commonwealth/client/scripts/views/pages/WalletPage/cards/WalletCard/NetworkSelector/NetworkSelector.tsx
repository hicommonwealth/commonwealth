import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useState } from 'react';
import { components } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import './NetworkSelector.scss';
import { networkChainOptions } from './options';
import { NetworkSelectorProps } from './types';

const NetworkSelector = ({
  network,
  onNetworkSelected,
}: NetworkSelectorProps) => {
  const [open, setIsOpen] = useState(false);

  return (
    <CWSelectList
      containerClassname="NetworkSelector"
      components={{
        // eslint-disable-next-line react/no-multi-comp
        Option: (originalProps) => (
          <components.Option {...originalProps}>
            <CWIcon
              // eslint-disable-next-line react/destructuring-assignment
              iconName={originalProps.data.icon}
              iconSize="small"
            />
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {originalProps.data.label} ({originalProps.data.value})
          </components.Option>
        ),
      }}
      noOptionsMessage={() => ''}
      value={network}
      defaultValue={network}
      formatOptionLabel={(option) => (
        <ClickAwayListener onClickAway={() => setIsOpen(false)}>
          <div onClick={() => setIsOpen(!open)}>
            <CWIcon iconName={option.icon} iconSize="large" />
            <CWText type="caption">{option.label.split(' ').at(-1)}</CWText>
          </div>
        </ClickAwayListener>
      )}
      menuIsOpen={open}
      isClearable={false}
      isSearchable={false}
      options={networkChainOptions}
      onChange={(option) => {
        option && onNetworkSelected(option);
        setIsOpen(false);
      }}
    />
  );
};

export default NetworkSelector;
