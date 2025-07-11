import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import React, { useState } from 'react';

import app from 'state';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import StakeIntegration from 'views/pages/CommunityManagement/StakeIntegration';
import CommunityOnchainTransactions from 'views/pages/CreateCommunity/steps/CommunityOnchainTransactions';
import { TransactionType } from 'views/pages/CreateCommunity/steps/CommunityOnchainTransactions/helpers';

import TopicDetails from './TopicDetails';
import WVConsent from './WVConsent';
import WVERC20Details from './WVERC20Details';
import WVMethodSelection from './WVMethodSelection';
import WVSPLDetails from './WVSPLDetails';
import WVSuiNativeDetails from './WVSuiNativeDetails';
import WVSuiTokenDetails from './WVSuiTokenDetails';
import { CreateTopicStep, getCreateTopicSteps } from './utils';

import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useEditGroupMutation, useFetchGroupsQuery } from 'state/api/groups';
import { useCreateTopicMutation } from 'state/api/topics';
import useUserStore from 'state/ui/user';

import { GatedActionEnum } from '@hicommonwealth/shared';
import Permissions from 'client/scripts/utils/Permissions';
import { PageNotFound } from '../../404';
import './Topics.scss';

interface TopicFormRegular {
  name: string;
  description?: string;
  featuredInSidebar?: boolean;
  featuredInNewPost?: boolean;
  newPostTemplate?: string;
}

export interface TopicFormERC20 {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSPL {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSuiNative {
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSuiToken {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormStake {
  weightedVoting?: TopicWeightedVoting | null;
}

export type HandleCreateTopicProps = {
  erc20?: TopicFormERC20;
  spl?: TopicFormSPL;
  suiNative?: TopicFormSuiNative;
  suiToken?: TopicFormSuiToken;
  stake?: TopicFormStake;
};

export interface TopicForm
  extends TopicFormRegular,
    TopicFormERC20,
    TopicFormSPL,
    TopicFormSuiNative,
    TopicFormSuiToken {}

export const Topics = () => {
  const [topicFormData, setTopicFormData] = useState<TopicForm | null>(null);
  const [createTopicStep, setCreateTopicStep] = useState(
    CreateTopicStep.TopicDetails,
  );
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const navigate = useCommonNavigate();
  const { mutateAsync: createTopic } = useCreateTopicMutation();
  const { mutateAsync: editGroup } = useEditGroupMutation({
    communityId: app.activeChainId() || '',
  });
  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

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

  const handleGroupsSelected = (groups: number[]) => {
    setSelectedGroups(groups);
  };

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  const handleCreateTopic = async ({
    erc20,
    spl,
    suiNative,
    suiToken,
    stake,
  }: HandleCreateTopicProps) => {
    if (!topicFormData) {
      return;
    }

    try {
      const result = await createTopic({
        name: topicFormData.name,
        description: topicFormData.description,
        featured_in_sidebar: topicFormData.featuredInSidebar || false,
        featured_in_new_post: topicFormData.featuredInNewPost || false,
        default_offchain_template: topicFormData.newPostTemplate || '',
        community_id: app.activeChainId() || '',
        ...(erc20
          ? {
              token_address: erc20.tokenAddress,
              token_symbol: erc20.tokenSymbol,
              token_decimals: erc20.tokenDecimals,
              vote_weight_multiplier: erc20.voteWeightMultiplier,
              chain_node_id: erc20.chainNodeId,
              weighted_voting: erc20.weightedVoting,
            }
          : {}),
        ...(spl
          ? {
              token_address: spl.tokenAddress,
              token_symbol: spl.tokenSymbol,
              token_decimals: spl.tokenDecimals,
              vote_weight_multiplier: spl.voteWeightMultiplier,
              weighted_voting: spl.weightedVoting,
            }
          : {}),
        ...(suiNative
          ? {
              token_symbol: suiNative.tokenSymbol,
              token_decimals: suiNative.tokenDecimals,
              vote_weight_multiplier: suiNative.voteWeightMultiplier,
              chain_node_id: suiNative.chainNodeId,
              weighted_voting: suiNative.weightedVoting,
            }
          : {}),
        ...(suiToken
          ? {
              token_address: suiToken.tokenAddress,
              token_symbol: suiToken.tokenSymbol,
              token_decimals: suiToken.tokenDecimals,
              vote_weight_multiplier: suiToken.voteWeightMultiplier,
              chain_node_id: suiToken.chainNodeId,
              weighted_voting: suiToken.weightedVoting,
            }
          : {}),
        ...(stake
          ? {
              weighted_voting: stake.weightedVoting,
            }
          : {}),
      });

      const newTopicId = result.topic?.id;

      console.log('test newTopicId', newTopicId);
      console.log('test selectedGroups', selectedGroups);

      for (const groupId of selectedGroups) {
        const group = groups.find((g) => g.id === groupId);
        if (!group) continue;
        const updatedTopics = [
          ...(group.topics || []),
          { id: newTopicId, is_private: true, name: topicFormData.name },
        ];
        await editGroup({
          community_id: app.activeChainId() || '',
          group_id: groupId,
          topics: updatedTopics.map((t) => ({
            id: t.id,
            is_private: true,
            permissions: Object.values(GatedActionEnum),
          })),
        });
      }

      navigate(`/discussions/${encodeURI(topicFormData.name.trim())}`);
    } catch (err) {
      notifyError('Failed to create topic');
      console.error(err);
    }
  };

  const goToMethodSelectionStep = () => {
    setCreateTopicStep(CreateTopicStep.WVMethodSelection);
  };

  const getCurrentStep = () => {
    switch (createTopicStep) {
      case CreateTopicStep.TopicDetails:
        return (
          <TopicDetails
            onStepChange={setCreateTopicStep}
            onSetTopicFormData={handleSetTopicFormData}
            onGroupsSelected={handleGroupsSelected}
            topicFormData={topicFormData}
          />
        );
      case CreateTopicStep.WVConsent:
        return (
          <WVConsent
            onStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVMethodSelection:
        return <WVMethodSelection onStepChange={setCreateTopicStep} />;
      case CreateTopicStep.WVNamespaceEnablement:
        return (
          <CommunityOnchainTransactions
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            selectedAddress={selectedAddress!}
            chainId={String(community?.ChainNode?.eth_chain_id)}
            transactionTypes={[TransactionType.DeployNamespace]}
            isTopicFlow
            onConfirmNamespaceDataStepCancel={goToMethodSelectionStep}
            onSignTransaction={(type) => {
              if (type === TransactionType.DeployNamespace) {
                setCreateTopicStep(CreateTopicStep.WVERC20Details);
              }
            }}
            onSignTransactionsStepCancel={goToMethodSelectionStep}
          />
        );
      case CreateTopicStep.WVERC20Details:
        return (
          <WVERC20Details
            onStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVSPLDetails:
        return (
          <WVSPLDetails
            onStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVSuiNativeDetails:
        return (
          <WVSuiNativeDetails
            onStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVSuiTokenDetails:
        return (
          <WVSuiTokenDetails
            onStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
      case CreateTopicStep.WVStake:
        return (
          <StakeIntegration
            isTopicFlow
            onTopicFlowStepChange={setCreateTopicStep}
            onCreateTopic={handleCreateTopic}
          />
        );
    }
  };

  return (
    <CWPageLayout>
      <div className="Topics">
        <CWFormSteps steps={getCreateTopicSteps(createTopicStep)} />

        {getCurrentStep()}
      </div>
    </CWPageLayout>
  );
};

export default Topics;
