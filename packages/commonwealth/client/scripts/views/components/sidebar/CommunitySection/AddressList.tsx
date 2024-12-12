import { formatAddressShort } from 'helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import { WalletId } from '@hicommonwealth/shared';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import {
  handleMouseEnter,
  handleMouseLeave,
} from 'client/scripts/views/menus/utils';
import useAuthentication from 'client/scripts/views/modals/AuthModal/useAuthentication';
import { PopoverMenu } from '../../component_kit/CWPopoverMenu';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import CWIconButton from '../../component_kit/new_designs/CWIconButton';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import './AddressList.scss';

interface AddressListProps {
  address?: string;
  addresses: AddressInfo[] | undefined;
  username?: string;
  profile: NewProfile;
  refreshProfiles: (addressInfo: AddressInfo) => void;
}

export const AddressList = ({
  address,
  addresses,
  username,
}: AddressListProps) => {
  const { openMagicWallet } = useAuthentication({});

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
              {addr.address === address && (
                <CWIcon iconName="checkCircleFilled" />
              )}
              {addr.walletId == WalletId.Magic && (
                <CWTooltip
                  placement="top"
                  content="Open wallet"
                  renderTrigger={(handleInteraction, isTooltipOpen) => {
                    return (
                      <CWIconButton
                        iconName="arrowSquareOut"
                        onClick={() => {
                          openMagicWallet().catch(console.error);
                        }}
                        onMouseEnter={(e) => {
                          handleMouseEnter({
                            e,
                            isTooltipOpen,
                            handleInteraction,
                          });
                        }}
                        onMouseLeave={(e) => {
                          handleMouseLeave({
                            e,
                            isTooltipOpen,
                            handleInteraction,
                          });
                        }}
                        className="open-wallet-icon"
                      />
                    );
                  }}
                />
              )}
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
