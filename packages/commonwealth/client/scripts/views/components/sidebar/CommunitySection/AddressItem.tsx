import { WalletId } from '@hicommonwealth/shared';
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
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';

import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { formatAddressShort } from 'shared/utils';
import { CWIdentificationTag } from '../../component_kit/new_designs/CWIdentificationTag';
import './AddressItem.scss';

type AddressItemProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  toggleRemoveModal: (
    val: boolean,
    address: AddressInfo,
    communityName: string,
  ) => void;
  isSelected: boolean;
  isInsideCommunity?: boolean;
};

const AddressItem = (props: AddressItemProps) => {
  const { addressInfo, toggleRemoveModal, isSelected, isInsideCommunity } =
    props;
  const { address, walletId, community } = addressInfo;

  const { openMagicWallet } = useAuthentication({});

  // user.addresses.community from user store don't have icon_url
  // and name, we make a new query to get them, ideally this should be returned
  // from api
  const { data: fetchedCommunity } = useGetCommunityByIdQuery({
    id: community.id,
    enabled: !!community.id,
  });

  if (!fetchedCommunity) return null;

  return (
    <div className="AddressItem">
      <div className="address-section">
        <div className="address">
          <CWIcon iconName="ethereum" iconSize="small" />
          <CWIdentificationTag
            iconLeft={walletId}
            address={`\u2022 ${formatAddressShort(address)}`}
          />
        </div>
        <CWTooltip
          placement="top"
          content="address copied!"
          renderTrigger={(handleInteraction, isTooltipOpen) => {
            return (
              <CWIconButton
                iconName="copySimple"
                onClick={(event) => {
                  saveToClipboard(address).catch(console.error);
                  handleInteraction(event);
                }}
                onMouseLeave={(e) => {
                  if (isTooltipOpen) {
                    handleInteraction(e);
                  }
                }}
                className="copy-icon"
              />
            );
          }}
        />
        {isSelected && (
          <CWIcon iconName="checkCircleFilled" className="check-mark-icon" />
        )}
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
      </div>
      {isInsideCommunity && (
        <div className="popover-section">
          <PopoverMenu
            menuItems={[
              {
                label: `Remove Address`,
                onClick: () =>
                  toggleRemoveModal(true, addressInfo, fetchedCommunity.name),
              },
            ]}
            renderTrigger={(onClick) => (
              <CWIconButton iconName="dotsHorizontal" onClick={onClick} />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default AddressItem;
