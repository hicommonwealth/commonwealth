import React, { useState } from 'react';
import { CWText } from '../component_kit/cw_text';
import VotingResultView, { VoteOption } from './VotingResultView';
import './VotingUI.scss'; // Create this SCSS file for styling

interface VotingOption {
  label: string;
  value: string;
  voteCount: number | string;
}

interface VotingUIProps {
  options: VotingOption[];
  proposalTitle?: string;
  timeRemaining?: string;
  canVote?: boolean;
  hasVoted?: boolean;
  onVote: (option: string | [string]) => void;
  type: 'cosmos' | 'snapshot';
  votingOption: VoteOption[];
}

const VotingUI: React.FC<VotingUIProps> = ({
  options,
  timeRemaining,
  canVote,
  hasVoted,
  onVote,
  type,
  votingOption,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVoteClick = () => {
    if (selectedOption && canVote && !hasVoted) {
      type === 'cosmos' ? onVote(selectedOption) : onVote([selectedOption]);
    }
  };

  return (
    <div className="poll-container">
      <CWText type="h5" fontWeight="semiBold">
        Actions
      </CWText>
      <div className="poll-box">
        <div className="poll-header">
          <CWText>POLL</CWText>
          <div className="timeline">
            <CWText>{timeRemaining}</CWText>
            <a href="#">View Activity</a>
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
    </div>
  );
};

export default VotingUI;
