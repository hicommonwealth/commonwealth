import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import './ContestLiveStep.scss';

const ContestLiveStep = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="ContestLiveStep">
      contest live
      <CWButton
        label="Go to contests"
        onClick={() => navigate('/manage/contests')}
      />
    </div>
  );
};

export default ContestLiveStep;
