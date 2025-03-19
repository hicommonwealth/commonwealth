import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './VotingResultView.scss';

export interface VoteOption {
  label: string;
  percentage: string;
  results: string;
}

interface GovernanceVoteProps {
  voteOptions: VoteOption[];
  showCombineBarOnly: boolean;
}

const VotingResultView: React.FC<GovernanceVoteProps> = ({
  voteOptions,
  showCombineBarOnly,
}) => {
  const totalVotes = voteOptions?.reduce(
    (sum, option) => sum + parseFloat(option.results || '0'),
    0,
  );

  console.log({ totalVotes });

  const totalPercent = voteOptions?.reduce(
    (sum, option) => sum + parseFloat(option.percentage || '0'),
    0,
  );

  if (Math.abs(totalPercent - 100) > 1) {
    console.warn('Vote percentages do not add up to 100%:', totalPercent);
  }

  const getCombinedBarColor = (label: string, index: number) => {
    const negativeLabels = ['No', 'No with Veto'];

    if (index === 0) return '#78A824';
    if (negativeLabels.includes(label)) return '#D63200';
    return '#666666';
  };

  return (
    <div className="governance-vote" role="region" aria-label="Voting Results">
      {!showCombineBarOnly && (
        <div className="header">
          <CWText type="h5" fontWeight="semiBold">
            Result
          </CWText>
        </div>
      )}

      <div className="main-container">
        {!showCombineBarOnly &&
          voteOptions?.map((option) => {
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
                      backgroundColor: '#3366cc',
                    }}
                  />
                </div>
              </div>
            );
          })}

        <div className="combined-progress">
          <div className="progress-bar">
            {
              voteOptions?.reduce(
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
          <a href="#" className="view-link">
            {'goverance'} <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VotingResultView);
