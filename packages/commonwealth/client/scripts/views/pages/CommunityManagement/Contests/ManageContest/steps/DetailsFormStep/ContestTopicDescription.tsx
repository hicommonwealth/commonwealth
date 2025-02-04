import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWIconButton } from 'client/scripts/views/components/component_kit/new_designs/CWIconButton/CWIconButton';
import CWPopover, {
  usePopover,
} from 'client/scripts/views/components/component_kit/new_designs/CWPopover/CWPopover';
import React from 'react';
import { getChainName } from './utils';

interface ContestTopicDescriptionProps {
  topic: {
    value: string;
    weightedVoting: TopicWeightedVoting;
  };
  topicsData?: {
    id?: number;
    token_symbol?: string | null;
    eth_chain_id?: number | null;
    vote_weight_multiplier?: number | null;
    community_id: string;
    token_address?: string | null;
  }[];
}

const ContestTopicDescription = ({
  topic,
  topicsData = [],
}: ContestTopicDescriptionProps) => {
  const popoverProps = usePopover();

  if (!topic) {
    return null;
  }

  const selectedTopic = topicsData.find((t) => t.id === Number(topic.value));

  if (!selectedTopic) {
    return null;
  }

  const tokenName = selectedTopic.token_symbol;
  const chainId = selectedTopic.eth_chain_id;
  const chainName = getChainName(chainId || 0);
  const weight = selectedTopic.vote_weight_multiplier;
  const communityStakeName = selectedTopic.community_id;

  const getPopover = (weightedVoting: TopicWeightedVoting) => (
    <span>
      <CWIconButton
        iconName="infoEmpty"
        buttonSize="sm"
        onMouseEnter={popoverProps.handleInteraction}
        onMouseLeave={popoverProps.handleInteraction}
      />
      <CWPopover
        title={
          weightedVoting === TopicWeightedVoting.ERC20
            ? 'ERC20 Topic'
            : 'Stake Topic'
        }
        body={
          <div className="explanation-container">
            <CWText type="b2">
              {weightedVoting === TopicWeightedVoting.ERC20
                ? `The topic you selected is weighted using an ERC20. 
                To change the weights, either choose another topic or create a new one.`
                : `The topic you selected is weighted using Community Stake. 
                To vote in the contest every user must buy stake, which they can do 
                from the left side bar of your community.`}
            </CWText>
          </div>
        }
        {...popoverProps}
      />
    </span>
  );

  if (topic.weightedVoting === TopicWeightedVoting.ERC20) {
    return (
      <CWText className="contest-topic-description">
        Community members will vote with <b>{tokenName}</b> on{' '}
        <b>{chainName}.</b> Each vote will have a weight of <b>{weight}.</b>{' '}
        {getPopover(TopicWeightedVoting.ERC20)}
      </CWText>
    );
  }

  if (topic.weightedVoting === TopicWeightedVoting.Stake) {
    return (
      <CWText className="contest-topic-description">
        Community members will need <b>{communityStakeName} Stake</b> to vote.
        {getPopover(TopicWeightedVoting.Stake)}
      </CWText>
    );
  }
};

export default ContestTopicDescription;
