import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './GoveranceVote.scss';

interface VoteOption {
  label: string;
  percentage: string;
  results: string;
}

interface GovernanceVoteProps {
  voteOptions: VoteOption[];
  quorum?: number;
  governanceType?: string;
  barColor?: string; // Color for individual bars
}

const GovernanceVote: React.FC<GovernanceVoteProps> = ({
  voteOptions,
  quorum = 60,
  governanceType = 'Governance',
  barColor = '#3366cc', // Default uniform color for individual bars
}) => {
  // Calculate total votes for validation or display
  const totalVotes = voteOptions.reduce(
    (sum, option) => sum + parseFloat(option.results || '0'),
    0,
  );

  // Validate total percentage (should be close to 100%)
  const totalPercent = voteOptions.reduce(
    (sum, option) => sum + parseFloat(option.percentage || '0'),
    0,
  );

  if (Math.abs(totalPercent - 100) > 1) {
    console.warn('Vote percentages do not add up to 100%:', totalPercent);
  }

  // Define combined bar colors based on index and specific labels
  const getCombinedBarColor = (label: string, index: number) => {
    const negativeLabels = ['No', 'No with Veto']; // Negative options

    if (index === 0) return '#78A824'; // First option is always positive (green)
    if (negativeLabels.includes(label)) return '#D63200'; // Negative options (red)
    return '#666666'; // Neutral (grey) for others (e.g., Abstain)
  };

  return (
    <div className="governance-vote" role="region" aria-label="Voting Results">
      <div className="header">
        <CWText type="h5" fontWeight="semiBold">
          Result
        </CWText>
      </div>
      <div className="main-container">
        {/* Render individual vote options dynamically */}
        {voteOptions.map((option) => {
          const percentage = parseFloat(option.percentage || '0');

          return (
            <div className="vote-option" key={option.label}>
              <div className="container">
                <span
                  className="option-label"
                  aria-label={`${option.label}: ${option.percentage}%`}
                >
                  {option.label}
                </span>
                <span className="percentage">{option.percentage}%</span>
              </div>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress"
                  style={{
                    width: `${option.percentage}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Combined progress bar with specific colors */}
        <div className="combined-progress">
          <div className="progress-bar">
            {
              voteOptions.reduce(
                (acc, option, index) => {
                  const percentage = parseFloat(option.percentage || '0');
                  const leftPosition = acc.prevLeft || 0;
                  const combinedColor = getCombinedBarColor(
                    option.label,
                    index,
                  );

                  acc.elements.push(
                    <div
                      key={option.label}
                      className={`progress ${option.label.toLowerCase().replace(/\s+/g, '-')}-progress`}
                      style={{
                        width: `${percentage}%`,
                        left: `${leftPosition}%`,
                        backgroundColor: combinedColor,
                      }}
                    />,
                  );
                  acc.prevLeft = (acc.prevLeft || 0) + percentage;
                  return acc;
                },
                { elements: [] as JSX.Element[], prevLeft: 0 },
              ).elements
            }
          </div>
        </div>

        {/* Footer */}
        <div className="vote-footer">
          <span className="quorum-text">{quorum}% quorum, will pass</span>
          <a href="#" className="view-link">
            {governanceType} <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GovernanceVote);
