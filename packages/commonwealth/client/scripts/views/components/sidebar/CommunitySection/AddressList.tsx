import { formatAddressShort } from 'helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import AddressInfo from 'client/scripts/models/AddressInfo';
import { PopoverMenu } from '../../component_kit/CWPopoverMenu';
import CWIconButton from '../../component_kit/new_designs/CWIconButton';
import './AddressList.scss';

interface CWIdentificationTagProps {
  address?: string;
  addresses: AddressInfo[];
  username?: string;
}

export const AddressList = ({
  address,
  addresses,
  username,
}: CWIdentificationTagProps) => {
  if ((!address && !username) || !addresses) {
    return null;
  }

  const filteredAddresses = Array.from(
    new Map(addresses.map((item) => [item.address, item])).values(),
  );

  return (
    <div className="AddressList">
      <div className="content-container">
        {filteredAddresses &&
          filteredAddresses.map((addr, index) => (
            <div className="address-list" key={index}>
              <div className="address-item">
                <CWText
                  className="address-label"
                  type="b2"
                  fontWeight="regular"
                >
                  {formatAddressShort(addr.address, 6)}
                </CWText>
              </div>
              <PopoverMenu
                menuItems={[
                  {
                    label: `Remove Address`,
                    onClick: () => {},
                  },
                ]}
                renderTrigger={(onclick) => (
                  <CWIconButton iconName="dotsHorizontal" onClick={onclick} />
                )}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
