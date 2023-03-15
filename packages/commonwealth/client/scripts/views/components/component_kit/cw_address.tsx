import React from 'react';

import 'components/component_kit/cw_address.scss';
import m from 'mithril';

import { CWText } from './cw_text';
import { getClasses } from './helpers';

type AddressProps = {
  address: string;
  darkMode?: boolean;
};

export const CWAddress = (props: AddressProps) => {
  const { address, darkMode } = props;

  return (
    <div
      className={getClasses<{ darkMode?: boolean }>({ darkMode }, 'Address')}
    >
      <CWText type="caption" className="address-text">
        {address}
      </CWText>
    </div>
  );
};
