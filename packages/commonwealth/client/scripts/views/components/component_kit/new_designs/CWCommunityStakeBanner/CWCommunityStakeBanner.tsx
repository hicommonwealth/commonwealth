import React from 'react';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWTag } from '../CWTag';

type CWCommunityStakeBannerProps = {
  onClose: () => void;
  onBuy: () => void;
  groupName: string;
};
export const CWCommunityStakeBanner = ({
  onClose,
  onBuy,
  groupName,
}: CWCommunityStakeBannerProps) => {
  return (
    <CWBanner
      className="CommunityStakeBanner"
      title="Community Staking Banner Header"
      body="The more stake you purchase, the greater your vote
      weight. This means you have greater influence over
      highlighting the ideas you think are most important
      while also supporting your community financially."
      buttons={[
        {
          label: 'Buy stake',
          buttonType: 'primary',
          onClick: onBuy,
        },
        {
          label: 'Learn More',
          buttonType: 'tertiary',
          onClick: () => {
            console.log('Learn more clicked');
          },
          iconRight: 'externalLink',
        },
      ]}
      onClose={onClose}
      footer={
        <div className="footer">
          Buying a stake will automatically place you in group
          <CWTag label={groupName} type="group" />
        </div>
      }
    />
  );
};
