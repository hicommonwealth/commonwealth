import { WalletId } from '@hicommonwealth/shared';
import { formatAddressShort } from 'client/scripts/helpers';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import {
  handleMouseEnter,
  handleMouseLeave,
} from 'client/scripts/views/menus/utils';
import useAuthentication from 'client/scripts/views/modals/AuthModal/useAuthentication';
import React from 'react';
import { PopoverMenu } from '../../component_kit/CWPopoverMenu';
import { CWIconButton } from '../../component_kit/cw_icon_button';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';

import './AddressItem.scss';

type AddressItemProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
  isSelected: boolean;
};

const AddressItem = (props: AddressItemProps) => {
  const { addressInfo, toggleRemoveModal, isSelected } = props;
  const { address, walletId } = addressInfo;

  const { openMagicWallet } = useAuthentication({});

  return (
    <div className="AddressItem">
      <div className="address">
        <CWText className="address-label" type="b2" fontWeight="regular">
          {formatAddressShort(address, 6)}
        </CWText>
      </div>
      {isSelected && <CWIcon iconName="checkCircleFilled" />}
      {walletId === WalletId.Magic && (
        <CWTooltip
          placement="top"
          content="Open wallet"
          renderTrigger={(handleInteraction, isTooltipOpen) => (
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
          )}
        />
      )}
      <PopoverMenu
        menuItems={[
          {
            label: `Remove Address`,
            onClick: () => toggleRemoveModal(true, addressInfo),
          },
        ]}
        renderTrigger={(onClick) => (
          <CWIconButton iconName="dotsHorizontal" onClick={onClick} />
        )}
      />
    </div>
  );
};

export default AddressItem;
