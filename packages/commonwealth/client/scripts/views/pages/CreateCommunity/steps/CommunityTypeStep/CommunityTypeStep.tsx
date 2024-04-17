import React, { useState } from 'react';

import useUserLoggedIn from 'hooks/useUserLoggedIn';
import AddressInfo from 'models/AddressInfo';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCommunitySelector, {
  SelectedCommunity,
} from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import NewCommunityAdminModal from 'views/modals/NewCommunityAdminModal';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from '../../../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../../../hooks/useBrowserAnalyticsTrack';
import { communityTypeOptions } from './helpers';

import { ChainBase } from '@hicommonwealth/shared';
import { AuthModal } from 'views/modals/AuthModal';
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { isLoggedIn } = useUserLoggedIn();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const handleCommunitySelection = ({
    type: selectedType,
    chainBase: selectedChainBase,
  }: SelectedCommunity) => {
    trackAnalytics({
      event: MixpanelCommunityCreationEvent.COMMUNITY_TYPE_CHOSEN,
      communityType: selectedType,
      chainBase: selectedChainBase,
    });

    setSelectedCommunity({ type: selectedType, chainBase: selectedChainBase });

    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
    } else {
      setIsNewCommunityAdminModalOpen(true);
    }
  };

  const handleClickConnectNewWallet = () => {
    setIsAuthModalOpen(true);
    setIsNewCommunityAdminModalOpen(false);
  };

  const handleClickContinue = (address: string) => {
    const pickedAddress = app.user.addresses.find(
      ({ addressId }) => String(addressId) === address,
    );
    setSelectedAddress(pickedAddress);
    handleContinue();
  };

  const [baseOption, blastOption, ethereumOption, ...advancedOptions] =
    communityTypeOptions;

  return (
    <div className="CommunityTypeStep">
      <CWText type="h2">Launch a community</CWText>
      <CWText className="subheader">
        Select the type of community you are looking to launch to get started.
        You must have a connected wallet with the ecosystem you select to launch
        a community. Members must also have a compatible wallet type to join
        your community.
      </CWText>
      <div className="advanced-options-container">
        <CWCommunitySelector
          key={baseOption.type}
          type={baseOption.type}
          title={baseOption.title}
          description={baseOption.description}
          isRecommended={baseOption.isRecommended}
          onClick={() =>
            handleCommunitySelection({
              type: baseOption.type,
              chainBase: baseOption.chainBase,
            })
          }
        />
        <CWCommunitySelector
          key={blastOption.type}
          type={blastOption.type}
          title={blastOption.title}
          description={blastOption.description}
          isRecommended={blastOption.isRecommended}
          onClick={() =>
            handleCommunitySelection({
              type: blastOption.type,
              chainBase: blastOption.chainBase,
            })
          }
        />

        <CWCommunitySelector
          key={ethereumOption.type}
          type={ethereumOption.type}
          title={ethereumOption.title}
          description={ethereumOption.description}
          isRecommended={ethereumOption.isRecommended}
          onClick={() =>
            handleCommunitySelection({
              type: ethereumOption.type,
              chainBase: ethereumOption.chainBase,
            })
          }
        />
      </div>
      <div className="advanced-options-container">
        <CWText type="h4">Advanced Options</CWText>

        {advancedOptions
          .filter(({ isHidden }) => !isHidden)
          .map(({ type, chainBase, title, description }) => (
            <CWCommunitySelector
              key={type}
              type={type}
              title={title}
              description={description}
              onClick={() => handleCommunitySelection({ type, chainBase })}
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsNewCommunityAdminModalOpen(true);
        }}
        showWalletsFor={
          communityTypeOptions.find((c) => c.type === selectedCommunity.type)
            ?.chainBase as Exclude<ChainBase, ChainBase.NEAR>
        }
      />
    </div>
  );
};

export default CommunityTypeStep;
