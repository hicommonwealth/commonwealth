import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWText } from '../component_kit/cw_text';
import { CWTag } from '../component_kit/new_designs/CWTag';

type CommunityStakeBannerProps = {
  onClose: () => void;
  groupName: string;
};
export const CommunityStakeBanner = ({
  onClose,
  groupName,
}: CommunityStakeBannerProps) => {
  const navigate = useCommonNavigate();

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
          buttonType: 'secondary',
          buttonAlt: 'green',
          buttonWidth: 'wide',
          onClick: () => {
            navigate('/');
          },
        },
        {
          label: 'Learn More',
          buttonType: 'tertiary',
          onClick: () => {
            navigate('/');
          },
          iconRight: 'externalLink',
        },
      ]}
      onClose={onClose}
      footer={
        <>
          <CWText type="caption" className="description">
            Buying a stake will automatically place you in group
          </CWText>
          <CWTag label={groupName} type="group" />
        </>
      }
    />
  );
};
