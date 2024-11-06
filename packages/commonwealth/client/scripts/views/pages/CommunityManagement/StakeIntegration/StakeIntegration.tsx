import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import AddressInfo from 'models/AddressInfo';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { HandleCreateTopicProps } from 'views/pages/CommunityManagement/Topics/Topics';
import { CreateTopicStep } from 'views/pages/CommunityManagement/Topics/utils';
import useGetCommunityByIdQuery from '../../../../state/api/communities/getCommuityById';
import { PageNotFound } from '../../404';
import CommunityStakeStep from '../../CreateCommunity/steps/CommunityStakeStep';
import CanBeDisabled from './CanBeDisabled';
import ContractInfo from './ContractInfo';
import './StakeIntegration.scss';
import Status from './Status';

interface StakeIntegrationProps {
  isTopicFlow?: boolean;
  onTopicFlowStepChange?: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const StakeIntegration = ({
  isTopicFlow,
  onTopicFlowStepChange,
  onCreateTopic,
}: StakeIntegrationProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { stakeEnabled, refetchStakeQuery } = useCommunityStake();

  const { data: community } = useGetCommunityByIdQuery({
    id: app.chain.meta.id,
    includeNodeInfo: true,
  });

  const contractInfo =
    // @ts-expect-error <StrictNullChecks/>
    commonProtocol?.factoryContracts[app?.chain?.meta?.ChainNode?.eth_chain_id];

  if (!contractInfo) {
    return <PageNotFound />;
  }

  const communityChainId = `${
    community?.ChainNode?.eth_chain_id || community?.ChainNode?.cosmos_chain_id
  }`;
  const selectedAddress = user.addresses.find(
    (x) =>
      x.address === user.activeAccount?.address &&
      x.community?.id === community?.id,
  );

  const createTopicHandler = () => {
    onCreateTopic({
      stake: {
        weightedVoting: TopicWeightedVoting.Stake,
      },
    }).catch((err) => {
      notifyError('Failed to create topic');
      console.log(err);
    });
  };

  const goBack = () => {
    isTopicFlow
      ? onTopicFlowStepChange?.(CreateTopicStep.WVMethodSelection)
      : navigate(`/manage/integrations`);
  };

  const handleSignTransactionsStepLaunchStakeSuccess = () => {
    refetchStakeQuery().catch(console.error);
  };

  return (
    <CWPageLayout className={clsx({ 'topic-stake': isTopicFlow })}>
      <section className="StakeIntegration">
        <CWText type="h2">Stake</CWText>
        <Status
          communityName={app.chain.meta.name || ''}
          isEnabled={stakeEnabled}
        />
        <CWDivider />
        {stakeEnabled ? (
          <>
            <ContractInfo
              contractAddress={contractInfo?.factory}
              smartContractAddress={contractInfo?.communityStake}
              voteWeightPerStake="1"
              namespace={community?.namespace}
              symbol={community?.default_symbol}
            />
            <CWDivider />
            <CanBeDisabled />
            {isTopicFlow && (
              <>
                <CWDivider />

                <section className="action-buttons">
                  <CWButton
                    type="button"
                    label="Back"
                    buttonWidth="wide"
                    buttonType="secondary"
                    onClick={() =>
                      onTopicFlowStepChange?.(CreateTopicStep.WVMethodSelection)
                    }
                  />
                  <CWButton
                    type="button"
                    label="Create topic with stakes"
                    buttonWidth="wide"
                    onClick={createTopicHandler}
                  />
                </section>
              </>
            )}
          </>
        ) : (
          <CommunityStakeStep
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            namespace={community?.namespace}
            symbol={community?.default_symbol}
            selectedAddress={selectedAddress as AddressInfo}
            chainId={communityChainId}
            isTopicFlow={isTopicFlow}
            onEnableStakeStepCancel={goBack}
            onSignTransactionsStepLaunchStakeSuccess={
              handleSignTransactionsStepLaunchStakeSuccess
            }
            onSignTransactionsStepCancel={goBack}
          />
        )}
      </section>
    </CWPageLayout>
  );
};

export default StakeIntegration;
