import React, { useEffect, useState } from 'react';

import { formatAddressShort } from 'helpers';
import _ from 'lodash';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import './NewCommunityAdminModal.scss';

interface NewCommunityAdminModalProps {
  onModalClose: () => void;
  handleClickConnectNewWallet: () => void;
  handleClickContinue: (selectedAddress: string) => void;
  selectedCommunity: SelectedCommunity;
  isTokenizedCommunity?: boolean;
}

const NewCommunityAdminModal = ({
  onModalClose,
  handleClickConnectNewWallet,
  handleClickContinue,
  selectedCommunity,
  isTokenizedCommunity,
}: NewCommunityAdminModalProps) => {
  const user = useUserStore();
  const availableAddressesOnSelectedChain = user.addresses?.filter(
    (addressInfo) => addressInfo.community.base === selectedCommunity.chainBase,
  );

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const availableAddresses = _.uniqBy(
    availableAddressesOnSelectedChain,
    'address',
  );

  const addressOptions = availableAddresses.map((addressInfo) => ({
    value: String(addressInfo.addressId),
    label: formatAddressShort(addressInfo.address, 6),
  }));

  const [tempAddress, setTempAddress] = useState(addressOptions?.[0]);
  const walletsAvailable = availableAddresses?.length > 0;

  const { isAddedToHomeScreen } = useAppStatus();

  useEffect(() => {
    if (!tempAddress) {
      setTempAddress(addressOptions?.[0]);
    }
  }, [addressOptions, tempAddress]);

  return (
    <div className="NewCommunityAdminModal">
      <CWModalHeader
        label={`New ${isTokenizedCommunity ? 'token and' : ''} community admin`}
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText type="b1" className="description">
          {walletsAvailable
            ? `${isTokenizedCommunity ? 'Token creators and' : ''} Community admins are associated with a wallet. ` +
              `Which wallet would you like to serve as the ${
                isTokenizedCommunity ? 'author/' : ''
              }admin of the new community?`
            : `In order to launch a ${
                isTokenizedCommunity ? 'token and' : ''
              } community within ${
                isTokenizedCommunity ? 'the BASE' : 'an'
              } ecosystem you must have a compatible wallet connected. ` +
              `How would you like to create your ${isTokenizedCommunity ? 'token and' : ''} community?`}
        </CWText>
        {walletsAvailable && (
          <CWSelectList
            label="Select Wallet"
            placeholder="Add or select a chain"
            isClearable={false}
            isSearchable={false}
            value={tempAddress}
            defaultValue={addressOptions[0]}
            options={addressOptions}
            onChange={setTempAddress}
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        {walletsAvailable ? (
          <>
            <CWButton
              label="Connect New Wallet"
              buttonType="secondary"
              onClick={() => {
                trackAnalytics({
                  event:
                    MixpanelCommunityCreationEvent.CONNECT_NEW_WALLET_PRESSED,
                  isPWA: isAddedToHomeScreen,
                });
                handleClickConnectNewWallet();
              }}
            />
            <CWButton
              label="Continue"
              onClick={() => handleClickContinue(tempAddress?.value)}
            />
          </>
        ) : (
          <div>
            <CWButton
              label="Connect Wallet"
              onClick={handleClickConnectNewWallet}
            />
          </div>
        )}
      </CWModalFooter>
    </div>
  );
};

export default NewCommunityAdminModal;
