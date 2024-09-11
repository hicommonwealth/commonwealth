import { commonProtocol } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CreateTopicStep } from 'views/pages/CommunityManagement/Topics/utils';
import { PageNotFound } from '../../404';
import CommunityStakeStep from '../../CreateCommunity/steps/CommunityStakeStep';
import CanBeDisabled from './CanBeDisabled';
import ContractInfo from './ContractInfo';
import './StakeIntegration.scss';
import Status from './Status';

interface StakeIntegrationProps {
  isTopicFlow?: boolean;
  onTopicFlowStepChange?: (step: CreateTopicStep) => void;
}

const StakeIntegration = ({
  isTopicFlow,
  onTopicFlowStepChange,
}: StakeIntegrationProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { stakeEnabled, refetchStakeQuery } = useCommunityStake();

  const handleStepChange = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refetchStakeQuery();
    navigate(`/manage/integrations`);
  };

  const contractInfo =
    // @ts-expect-error <StrictNullChecks/>
    commonProtocol?.factoryContracts[app?.chain?.meta?.ChainNode?.eth_chain_id];

  if (!contractInfo) {
    return <PageNotFound />;
  }

  const community = app.chain.meta;
  const communityChainId = `${
    community?.ChainNode?.eth_chain_id || community?.ChainNode?.cosmos_chain_id
  }`;
  const selectedAddress = user.addresses.find(
    (x) =>
      x.address === user.activeAccount?.address &&
      x.community?.id === community?.id,
  );

  const createTopicHandler = () => {
    console.log('create topic');
    // TODO temp solution - will be integrated in upcoming PR
    navigate('/discussions');
  };

  return (
    <CWPageLayout className={clsx({ 'topic-stake': isTopicFlow })}>
      <section className="StakeIntegration">
        <CWText type="h2">Stake</CWText>
        <Status
          communityName={app.activeChainId() || ''}
          isEnabled={stakeEnabled}
        />
        <CWDivider />
        {stakeEnabled ? (
          <>
            <ContractInfo
              contractAddress={contractInfo?.factory}
              smartContractAddress={contractInfo?.communityStake}
              voteWeightPerStake="1"
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
            goToSuccessStep={handleStepChange}
            onTopicFlowStepChange={onTopicFlowStepChange}
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            // @ts-expect-error <StrictNullChecks/>
            selectedAddress={selectedAddress}
            chainId={communityChainId}
            isTopicFlow={isTopicFlow}
          />
        )}
      </section>
    </CWPageLayout>
  );
};

export default StakeIntegration;
