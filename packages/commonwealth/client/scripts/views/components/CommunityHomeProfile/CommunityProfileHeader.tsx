import 'components/CommunityHomeProfile/CommunityProfileHeader.scss';
import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import type { CategorizedSocialLinks } from '../../../models/ChainInfo';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { SocialAccounts } from '../social_accounts';

export interface ProfileHeaderProps {
  name: string;
  iconUrl: string;
  description: string;
  socialLinks: CategorizedSocialLinks;
  threadCount: number;
  addressCount: number;
  defaultSymbol: string;
  stakeEnabled: boolean;
  stakeValue: string;
  stakeChange: number;
}

const CommunityProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  iconUrl,
  description,
  socialLinks,
  threadCount,
  addressCount,
  defaultSymbol,
  stakeEnabled,
  stakeValue,
  stakeChange,
}) => {
  const [counter, setCounter] = useState(0);
  const [clickPositions, setClickPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleIconClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 10 + Math.random() * 20;
    const y = e.clientY - rect.top - 10 + Math.random() * 20;

    setCounter((prevCounter) => prevCounter + 10);
    setClickPositions((prev) => [...prev, { x, y }]);

    setTimeout(() => {
      setClickPositions((prev) => prev.slice(1));
    }, 500);
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getBorderColorClass = () => {
    if (isHovered) return 'hovered';
    return '';
  };

  const subHeaderData = {
    mcap: '$5.6k', // This is still a dummy value, replace if you have actual data
    coin: stakeEnabled ? `$${stakeValue}` : `$0.00`,
    change24h: stakeEnabled ? `${stakeChange.toFixed(2)}%` : '0.00%',
    members: addressCount,
    threads: threadCount,
  };

  return (
    <>
      <div className="counter-section">
        <CWText type="b1">{`YOUR ${defaultSymbol.toUpperCase()}:`}</CWText>
        <CWText type="h2">{counter}</CWText>
        <CWIcon iconName="infoEmpty" iconSize="small" />
        <CWText type="b2">{`${_.capitalize(
          'Valued at $X earning Y',
        )} ${defaultSymbol.toUpperCase()} per hr`}</CWText>
      </div>
      <div className="ProfileHeader">
        <div className="content-container">
          <div className="top-content">
            <div className="community-info">
              <div className="header">
                <div className="community-name">
                  <div
                    className={`community-avatar-wrapper ${getBorderColorClass()}`}
                    onClick={handleIconClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="Community Icon"
                        className="community-avatar"
                      />
                    ) : (
                      <div className="default-icon">
                        {_.capitalize(defaultSymbol.charAt(0))}
                      </div>
                    )}
                    {clickPositions.map((pos, index) => (
                      <div
                        key={index}
                        className="overlay"
                        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                      >
                        +10
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {description && (
                <CWText className="description" type="b2">
                  {description}
                </CWText>
              )}
            </div>
          </div>
          <SocialAccounts socialLinks={socialLinks} />
        </div>
      </div>
      <div className="SubHeader">
        <div className="stat">
          <CWText type="b1">{subHeaderData.mcap}</CWText>
          <CWText type="b2">mcap</CWText>
        </div>
        <div className="stat">
          <CWText type="b1">{subHeaderData.coin}</CWText>
          <CWText type="b2">per ${defaultSymbol}</CWText>
        </div>
        <div className="stat">
          <CWText type="b1">{subHeaderData.change24h}</CWText>
          <CWText type="b2">24h</CWText>
        </div>
        <div className="stat">
          <div className="member-data">
            <CWIcon iconName="users" iconSize="small" />
            <CWText type="b1">
              {subHeaderData.members.toLocaleString('en-US')}
            </CWText>
          </div>
          <CWText type="b2">members</CWText>
        </div>
        <div className="stat">
          <div className="thread-data">
            <CWIcon iconName="notepad" iconSize="small" />
            <CWText type="b1">
              {subHeaderData.threads.toLocaleString('en-US')}
            </CWText>
          </div>
          <CWText type="b2">threads</CWText>
        </div>
      </div>
    </>
  );
};

export default CommunityProfileHeader;
