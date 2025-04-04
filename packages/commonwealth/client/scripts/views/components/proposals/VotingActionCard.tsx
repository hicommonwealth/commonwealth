import React, { useEffect, useState } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import './VotingActionCard.scss';
import VotingResultView, { VoteOption } from './VotingResultView';

interface VotingOption {
  label: string;
  value: string;
  voteCount: number | string;
}

interface VotingActionCardProps {
  options: VotingOption[];
  proposalTitle?: string;
  timeRemaining?: string;
  canVote?: boolean;
  hasVoted?: boolean;
  onVote: (option: string | [string]) => void;
  type: 'cosmos' | 'snapshot';
  votingOption: VoteOption[];
  toggleShowVotesDrawer: (newState: boolean) => void;
  governanceUrl?: string;
  defaultVotingOption?: string | undefined;
}

const VotingActionCard = ({
  options,
  timeRemaining,
  canVote,
  hasVoted,
  onVote,
  type,
  votingOption,
  toggleShowVotesDrawer,
  defaultVotingOption,
}: VotingActionCardProps) => {
  const [selectedOption, setSelectedOption] = useState(defaultVotingOption);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleVoteClick = () => {
    if (selectedOption && canVote && !hasVoted) {
      type === 'cosmos' ? onVote(selectedOption) : onVote([selectedOption]);
    }
  };
  useEffect(() => {
    if (defaultVotingOption) {
      setSelectedOption(defaultVotingOption);
    }
  }, [defaultVotingOption]);
  return (
    <div className="VotingActionCard">
      <div className="voting-action-card-header ">
        <CWText type="h5" fontWeight="semiBold">
          Actions
        </CWText>
        <CWIcon
          iconName={isCollapsed ? 'caretDown' : 'caretUp'}
          iconSize="small"
          className="caret-icon"
          weight="bold"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
      {!isCollapsed && (
        <>
          <div className="poll-box">
            <div className="poll-header">
              <CWText>POLL</CWText>
              <div className="timeline">
                <CWText>{timeRemaining}</CWText>

                <CWText
                  onClick={() => {
                    toggleShowVotesDrawer(true);
                  }}
                  className="ViewActivity"
                >
                  View Activity
                </CWText>
              </div>
            </div>
            <CWText type="b2" className="poll-title">
              Do you support this proposal?
            </CWText>

            <div className="voting-options">
              {options.map((option) => (
                <button
                  key={option.value}
                  className={`option ${selectedOption === option.value ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option.value)}
                  disabled={!canVote || hasVoted}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="vote-button"
              onClick={handleVoteClick}
              disabled={!canVote || hasVoted}
            >
              Vote
            </button>
          </div>
          <CWText type="h5" fontWeight="semiBold">
            Results
          </CWText>
          <VotingResultView voteOptions={votingOption} showCombineBarOnly />
        </>
      )}
    </div>
  );
};

export default VotingActionCard;
