import React, { useState } from 'react';
import './VotingUI.scss'; // Create this SCSS file for styling

interface VoteOption {
  label: string;
  value: string;
  voteCount: number | string;
}

interface VotingUIProps {
  options: VoteOption[]; // Dynamic voting options with counts
  proposalTitle?: string; // Title/question for the poll
  timeRemaining?: string; // Time remaining text
  canVote?: boolean; // Whether voting is allowed
  hasVoted?: boolean; // Whether the user has already voted
  onVote: (option: string | [string]) => void; // Voting callback
  type: 'cosmos' | 'snapshot'; // Differentiate between Cosmos and Snapshot
}

const VotingUI: React.FC<VotingUIProps> = ({
  options,
  proposalTitle = 'Do you support this proposal?',
  timeRemaining = '7 days left',
  canVote = true,
  hasVoted = true,
  onVote,
  type,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVoteClick = () => {
    if (selectedOption && !canVote && !hasVoted) {
      type === 'cosmos' ? onVote(selectedOption) : onVote([selectedOption]);
    }
  };
  //   console.log('UIvoting', options, canVote, hasVoted);
  return (
    <div className="poll-container">
      <h2>Actions</h2>
      <div className="poll-box">
        <div className="poll-header">
          <span>POLL</span>
          <span>
            {timeRemaining} <a href="#">View Activity</a>
          </span>
        </div>
        <p>{proposalTitle}</p>
        {!hasVoted && !canVote && (
          <div className="voting-options">
            {options.map((option) => (
              <button
                key={option.value}
                className={`option ${selectedOption === option.value ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option.value)}
                disabled={canVote || hasVoted}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        {!hasVoted && !canVote && (
          <button
            className="vote-button"
            onClick={handleVoteClick}
            disabled={false}
          >
            Vote
          </button>
        )}
      </div>
    </div>
  );
};

export default VotingUI;
