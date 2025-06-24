import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './NoContestsCard.scss';

const NoContestsCard = () => {
  const navigate = useCommonNavigate();
  return (
    <CWCard className="NoContestsCard" fullWidth>
      <CWText type="h4" className="title">
        No contests in this community
      </CWText>
      <CWText type="b1" className="subtitle">
        Explore contests running in other communities
      </CWText>
      <CWButton
        label="Explore contests"
        buttonWidth="full"
        onClick={() => navigate('/explore?tab=contests', {}, null)}
      />
    </CWCard>
  );
};

export default NoContestsCard;
