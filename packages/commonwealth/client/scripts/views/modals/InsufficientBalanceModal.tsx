import { ChainBase } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import React from 'react';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import useManageCommunityStakeModalStore from 'state/ui/modals/manageCommunityStakeModal';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWModalBody } from 'views/components/component_kit/new_designs/CWModal/CWModalBody';
import { CWModalFooter } from 'views/components/component_kit/new_designs/CWModal/CWModalFooter';
import { CWModalHeader } from 'views/components/component_kit/new_designs/CWModal/CWModalHeader';
import { ManageCommunityStakeModalMode } from './ManageCommunityStakeModal/types';

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol?: string;
  isCommunityStake: boolean;
  communityId: string;
}

export const InsufficientBalanceModal: React.FC<
  InsufficientBalanceModalProps
> = ({ isOpen, onClose, tokenSymbol, isCommunityStake, communityId }) => {
  const { setModeOfManageCommunityStakeModal, setSelectedCommunity } =
    useManageCommunityStakeModalStore();

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      includeNodeInfo: true,
      enabled: isOpen,
    });

  const handleGetVotingPower = () => {
    if (
      community &&
      community.name &&
      community.base &&
      community.icon_url &&
      community.namespace &&
      community.ChainNode &&
      community.ChainNode.url &&
      community.ChainNode.eth_chain_id !== null &&
      community.ChainNode.eth_chain_id !== undefined
    ) {
      setSelectedCommunity({
        id: community.id,
        name: community.name,
        base: community.base as ChainBase,
        iconUrl: community.icon_url,
        namespace: community.namespace,
        ChainNode: {
          url: community.ChainNode.url,
          ethChainId: community.ChainNode.eth_chain_id,
        },
      });
      setModeOfManageCommunityStakeModal(
        'buy' as ManageCommunityStakeModalMode,
      );
      onClose();
    } else {
      console.error(
        'Could not find complete community details for',
        communityId,
        'Community data:',
        community,
      );
      notifyError('Could not load community staking details.');
      onClose();
    }
  };

  const title = 'Insufficient Balance to Upvote';
  let message = '';

  if (isCommunityStake) {
    message =
      'You need to stake in this community to get voting power for upvoting.';
  } else if (tokenSymbol) {
    message = `You need ${tokenSymbol} tokens to upvote in this topic.`;
  } else {
    message = 'You do not have the required balance to upvote.';
  }

  const isGetVotingPowerDisabled = isLoadingCommunity || !community;

  const modalContent = (
    <>
      <CWModalHeader label={title} onModalClose={onClose} />
      <CWModalBody>
        <CWText style={{ display: 'block', textAlign: 'center' }}>
          {message}
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonType="secondary"
          buttonHeight="lg"
          label="Dismiss"
          onClick={onClose}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="lg"
          label="Get Voting Power"
          onClick={handleGetVotingPower}
          disabled={!!isGetVotingPowerDisabled}
        />
      </CWModalFooter>
    </>
  );

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="small"
      content={modalContent}
    />
  );
};
