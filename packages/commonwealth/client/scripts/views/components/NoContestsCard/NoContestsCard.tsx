import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './NoContestsCard.scss';

const NoContestsCard = () => {
  const navigate = useCommonNavigate();
  const communityId = app.activeChainId() || '';

  return (
    <CWCard className="NoContestsCard" fullWidth>
      <CWText type="h4" className="title">
        No contests in this community. Learn about contests{' '}
        <a
          href="https://blog.common.xyz/introducing-farcaster-contests/"
          target="_blank"
          rel="noopener noreferrer"
        >
          here.
        </a>
      </CWText>
      <CWButton
        label="Explore contests"
        buttonWidth="full"
        onClick={() => navigate('/explore?tab=contests', {}, null)}
      />
      {communityId && (
        <CWButton
          label="Launch a contest"
          buttonWidth="full"
          onClick={() => navigate('/manage/contests/launch', {}, null)}
        />
      )}
    </CWCard>
  );
};

export default NoContestsCard;
