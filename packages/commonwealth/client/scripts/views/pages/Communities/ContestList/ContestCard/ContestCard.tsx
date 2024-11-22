import commonLogo from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import clsx from 'clsx';
import React from 'react';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import { CWButton } from '../../../../components/component_kit/new_designs/CWButton/CWButton';
import { CWThreadAction } from '../../../../components/component_kit/new_designs/cw_thread_action';
import { Contest } from '../../../CommunityManagement/Contests/ContestsList';

import './ContestCard.scss';

interface ContestCardProps {
  contest: Contest;
  community: { name: string; iconUrl: string };
}

const ContestCard = ({ contest, community }: ContestCardProps) => {
  const timeRemaining = '23 hours'; // TODO: Calculate from contest.end_time

  return (
    <div className="ContestCard">
      <div className="contest-banner">
        <img
          src={contest.image_url}
          alt="Contest banner"
          className="banner-image"
        />
      </div>

      <div className="contest-content">
        <div className="contest-header">
          <CWCommunityAvatar
            community={{
              name: community.name,
              iconUrl: community.iconUrl,
            }}
          />

          <CWText type="h3" fontWeight="medium" className="contest-title">
            {contest.name}

            <div className="contest-icon-container">
              <img
                className={clsx(
                  'contest-icon',
                  !contest.is_farcaster_contest && 'common-icon',
                )}
                src={contest.is_farcaster_contest ? farcasterUrl : commonLogo}
              />
            </div>
          </CWText>
        </div>

        <div className="contest-timing">
          <CWText type="b2" fontWeight="medium" className="time-remaining">
            Ends in {timeRemaining}
          </CWText>
        </div>

        <div className="prizes-section">
          <CWText type="b2" fontWeight="medium">
            Current Prizes
          </CWText>
          <div className="prize-list">
            <div className="prize-item">
              <CWText type="b2">1st Prize</CWText>
              <CWText type="b2" fontWeight="semiBold">
                ETH .00013456
              </CWText>
            </div>
            <div className="prize-item">
              <CWText type="b2">2nd Prize</CWText>
              <CWText type="b2" fontWeight="semiBold">
                ETH .00002518
              </CWText>
            </div>
            <div className="prize-item">
              <CWText type="b2">3rd Prize</CWText>
              <CWText type="b2" fontWeight="semiBold">
                ETH .00000981
              </CWText>
            </div>
          </div>
        </div>

        <div className="contest-actions">
          <CWThreadAction action="leaderboard" label="Leaderboard" />
          <CWThreadAction action="fund" label="Previous winners" />
        </div>

        <CWButton
          buttonHeight="sm"
          buttonWidth="full"
          label="Go to contest"
          onClick={() => {
            /* TODO: Navigate to contest */
          }}
        />
      </div>
    </div>
  );
};

export default ContestCard;
