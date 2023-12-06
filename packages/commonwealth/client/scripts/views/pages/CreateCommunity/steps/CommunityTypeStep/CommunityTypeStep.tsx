import React, { useState } from 'react';

import WebWalletController from 'controllers/app/web_wallets';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import AddressInfo from 'models/AddressInfo';
import app from 'state';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import CWCommunitySelector, {
  SelectedCommunity,
} from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import NewCommunityAdminModal from 'views/modals/NewCommunityAdminModal';
import { LoginModal } from 'views/modals/login_modal';
import { communityTypeOptions } from './helpers';

import './CommunityTypeStep.scss';

interface CommunityTypeStepProps {
  selectedCommunity: SelectedCommunity;
  setSelectedCommunity: ({ type, chainBase }: SelectedCommunity) => void;
  setSelectedAddress: (addressInfo: AddressInfo) => void;
  handleContinue: () => void;
}

const CommunityTypeStep = ({
  selectedCommunity,
  setSelectedCommunity,
  setSelectedAddress,
  handleContinue,
}: CommunityTypeStepProps) => {
  const [isNewCommunityAdminModalOpen, setIsNewCommunityAdminModalOpen] =
    useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { isLoggedIn } = useUserLoggedIn();

  const handleCommunitySelection = ({
    type: selectedType,
    chainBase: selectedChainBase,
  }: SelectedCommunity) => {
    setSelectedCommunity({ type: selectedType, chainBase: selectedChainBase });

    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setIsNewCommunityAdminModalOpen(true);
    }
  };

  const availableWallets = WebWalletController.Instance.availableWallets(
    communityTypeOptions.find((c) => c.type === selectedCommunity.type)
      ?.chainBase,
  );

  const handleClickConnectNewWallet = () => {
    setIsLoginModalOpen(true);
    setIsNewCommunityAdminModalOpen(false);
  };

  const handleClickContinue = (address: string) => {
    const pickedAddress = app.user.addresses.find(
      ({ addressId }) => String(addressId) === address,
    );
    setSelectedAddress(pickedAddress);
    handleContinue();
  };

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
            selectedCommunity={selectedCommunity}
            handleClickConnectNewWallet={handleClickConnectNewWallet}
            handleClickContinue={handleClickContinue}
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
