import React, { useState } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
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
  governanceUrl?: string;
}

const VotingResultView: React.FC<GovernanceVoteProps> = ({
  voteOptions,
  showCombineBarOnly,
  governanceUrl,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const totalVotes = voteOptions?.reduce(
    (sum, option) => sum + parseFloat(option.results || '0'),
    0,
  );

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
  function formatVoteCount(number) {
    if (number >= 1_000_000) {
      return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (number >= 1_000) {
      return (number / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
      return number.toString();
    }
  }
  return (
    <>
      {!showCombineBarOnly ? (
        <div className="VotingResultView">
          <div className="voting-result-header">
            <CWText type="h5" fontWeight="semiBold">
              Result
            </CWText>
            <CWText type="h5" fontWeight="semiBold">
              {formatVoteCount(totalVotes)} Votes
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
            <div className="main-container">
              {voteOptions?.map((option) => {
                const percentage = parseFloat(option.percentage || '0');

                return (
                  <div className="vote-option" key={option.label}>
                    <div className="container">
                      <CWText type="b2" className="option-label">
                        {option.label}
                      </CWText>
                      <CWText className="percentage">
                        {option.percentage}%{' '}
                      </CWText>
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

                        // Only add to visual elements if percentage is greater than 0
                        if (percentage > 0) {
                          acc.elements.push(
                            <div
                              key={option.label}
                              className="progress-container"
                              style={{
                                width: `${percentage}%`,
                                left: `${leftPosition}%`,
                              }}
                            >
                              <div
                                className={`progress ${option.label.toLowerCase().replace(/\s+/g, '-')}-progress`}
                                style={{
                                  width: '100%',
                                  backgroundColor: combinedColor,
                                }}
                              />
                            </div>,
                          );
                        }

                        acc.prevLeft = (acc.prevLeft || 0) + percentage;
                        return acc;
                      },
                      { elements: [] as JSX.Element[], prevLeft: 0 },
                    ).elements
                  }
                </div>
              </div>
              <div className="vote-footer">
                <a href={governanceUrl} className="view-link">
                  View on snapshot <span>↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {!isCollapsed && (
            <div className="combined-bar-container">
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
                              height: '7px',
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
            </div>
          )}
        </>
      )}
    </>
  );
};

export default React.memo(VotingResultView);
