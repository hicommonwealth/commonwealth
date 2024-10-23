import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import React, { useState } from 'react';

import app from 'state';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import StakeIntegration from 'views/pages/CommunityManagement/StakeIntegration';

import CommunityStakeStep from '../../CreateCommunity/steps/CommunityStakeStep';
import TopicDetails from './TopicDetails';
import WVConsent from './WVConsent';
import WVERC20Details from './WVERC20Details';
import WVMethodSelection from './WVMethodSelection';
import { CreateTopicStep, getCreateTopicSteps } from './utils';

import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useCreateTopicMutation } from 'state/api/topics';
import useUserStore from 'state/ui/user';

import './Topics.scss';

interface TopicFormRegular {
  name: string;
  description?: string;
  featuredInSidebar?: boolean;
}

export interface TopicFormERC20 {
  tokenAddress?: string;
  tokenSymbol?: string;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormStake {
  weightedVoting?: TopicWeightedVoting | null;
}

export type HandleCreateTopicProps = {
  erc20?: TopicFormERC20;
  stake?: TopicFormStake;
};

export interface TopicForm extends TopicFormRegular, TopicFormERC20 {}

export const Topics = () => {
  const [topicFormData, setTopicFormData] = useState<TopicForm | null>(null);
  const [createCommunityStep, setCreateCommunityStep] = useState(
    CreateTopicStep.TopicDetails,
  );

  const navigate = useCommonNavigate();
  const { mutateAsync: createTopic } = useCreateTopicMutation();

  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    includeNodeInfo: true,
  });

  const user = useUserStore();

  const selectedAddress = user.addresses.find(
    (x) =>
      x.address === user.activeAccount?.address &&
      x.community?.id === community?.id,
  );

  const handleSetTopicFormData = (data: Partial<TopicForm>) => {
    setTopicFormData((prevState) => ({ ...prevState, ...data }));
  };

  const handleCreateTopic = async ({
    erc20,
    stake,
  }: HandleCreateTopicProps) => {
    if (!topicFormData) {
      return;
    }

    try {
      await createTopic({
        name: topicFormData.name,
        description: topicFormData.description,
        featured_in_sidebar: topicFormData.featuredInSidebar || false,
        featured_in_new_post: false,
        default_offchain_template: '',
        community_id: app.activeChainId() || '',
        ...(erc20
          ? {
              token_address: erc20.tokenAddress,
              token_symbol: erc20.tokenSymbol,
              vote_weight_multiplier: erc20.voteWeightMultiplier,
              chain_node_id: erc20.chainNodeId,
              weighted_voting: erc20.weightedVoting,
            }
          : {}),
        ...(stake
          ? {
              weighted_voting: stake.weightedVoting,
            }
          : {}),
      });

      navigate(`/discussions/${encodeURI(topicFormData.name.trim())}`);
    } catch (err) {
      notifyError('Failed to create topic');
      console.error(err);
    }
  };

  const getCurrentStep = () => {
    switch (createCommunityStep) {
      case CreateTopicStep.TopicDetails:
        return (
          <TopicDetails
            onStepChange={setCreateCommunityStep}
            onSetTopicFormData={handleSetTopicFormData}
            topicFormData={topicFormData}
          />
        );
      case CreateTopicStep.WVConsent:
        return (
          <WVConsent
            onStepChange={setCreateCommunityStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVMethodSelection:
        return (
          <WVMethodSelection
            onStepChange={setCreateCommunityStep}
            hasNamespace={!!community?.namespace}
          />
        );
      case CreateTopicStep.WVNamespaceEnablement:
        return (
          <CommunityStakeStep
            goToSuccessStep={() =>
              setCreateCommunityStep(CreateTopicStep.WVERC20Details)
            }
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            onTopicFlowStepChange={setCreateCommunityStep}
            selectedAddress={selectedAddress!}
            chainId={String(community?.ChainNode?.eth_chain_id)}
            onlyNamespace
            isTopicFlow
          />
        );
      case CreateTopicStep.WVERC20Details:
        return (
          <WVERC20Details
            onStepChange={setCreateCommunityStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVStake:
        return (
          <StakeIntegration
            isTopicFlow
            onTopicFlowStepChange={setCreateCommunityStep}
            onCreateTopic={handleCreateTopic}
          />
        );
    }
  };

  return (
    <CWPageLayout>
      <div className="Topics">
        <CWFormSteps steps={getCreateTopicSteps(createCommunityStep)} />

        {getCurrentStep()}
      </div>
    </CWPageLayout>
  );
};

export default Topics;
