import { uniqBy } from 'lodash';
import React, { useState } from 'react';

import WebWalletController from 'controllers/app/web_wallets';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import AddressInfo from 'models/AddressInfo';
import app from 'state';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import CWCommunitySelector, {
  CommunityType,
  SelectorClick,
} from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import NewCommunityAdminModal from 'views/modals/NewCommunityAdminModal';
import { LoginModal } from 'views/modals/login_modal';
import { communityTypeOptions } from './helpers';

import './CommunityTypeStep.scss';

interface CommunityTypeStepProps {
  selectedCommunityType: CommunityType;
  setSelectedCommunityType: (communityType: CommunityType) => void;
  setSelectedAddress: (addressInfo: AddressInfo) => void;
  handleContinue: () => void;
}

const CommunityTypeStep = ({
  selectedCommunityType,
  setSelectedCommunityType,
  setSelectedAddress,
  handleContinue,
}: CommunityTypeStepProps) => {
  const [isNewCommunityAdminModalOpen, setIsNewCommunityAdminModalOpen] =
    useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<AddressInfo[]>(
    [],
  );
  const { isLoggedIn } = useUserLoggedIn();

  const handleCommunitySelection = ({
    type: selectedType,
    chainBase: selectedChainBase,
  }: SelectorClick) => {
    const availableAddressesOnSelectedChain = app.user.addresses.filter(
      (addressInfo) => {
        if (selectedType === CommunityType.Polygon) {
          return (
            addressInfo.community.base === selectedChainBase &&
            addressInfo.community.id === CommunityType.Polygon
          );
        }

        return addressInfo.community.base === selectedChainBase;
      },
    );

    const uniqueAddresses = uniqBy(
      availableAddressesOnSelectedChain,
      'address',
    );

    setSelectedCommunityType(selectedType);

    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setIsNewCommunityAdminModalOpen(true);
      setAvailableAddresses(uniqueAddresses);
    }
  };

  const availableWallets = WebWalletController.Instance.availableWallets(
    communityTypeOptions.find((c) => c.type === selectedCommunityType)
      ?.chainBase,
  );

  return (
    <div className="CommunityTypeStep">
      <div className="selectors-container">
        {communityTypeOptions.map(({ type, chainBase, title, description }) => (
          <CWCommunitySelector
            key={type}
            type={type}
            chainBase={chainBase}
            title={title}
            description={description}
            onClick={handleCommunitySelection}
          />
        ))}
      </div>
      <CWModal
        size="small"
        visibleOverflow
        content={
          <NewCommunityAdminModal
            onModalClose={() => setIsNewCommunityAdminModalOpen(false)}
            availableAddresses={availableAddresses}
            handleClickConnectNewWallet={() => {
              setIsLoginModalOpen(true);
              setIsNewCommunityAdminModalOpen(false);
            }}
            handleClickContinue={(address) => {
              const pickedAddress = availableAddresses.find(
                ({ addressId }) => String(addressId) === address,
              );
              setSelectedAddress(pickedAddress);
              handleContinue();
            }}
          />
        }
        onClose={() => setIsNewCommunityAdminModalOpen(false)}
        open={isNewCommunityAdminModalOpen}
      />
      <CWModal
        content={
          <LoginModal
            initialWallets={availableWallets}
            onModalClose={() => setIsLoginModalOpen(false)}
            onSuccess={() => {
              setIsNewCommunityAdminModalOpen(true);
            }}
          />
        }
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </div>
  );
};

export default CommunityTypeStep;
