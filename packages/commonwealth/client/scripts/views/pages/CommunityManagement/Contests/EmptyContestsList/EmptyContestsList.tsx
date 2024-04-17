import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

const EmptyContestsList = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="EmptyContestsList">
      <CWText>You haven’t launched any contests yet</CWText>
      <CWButton
        label="Launch a contest"
        onClick={() => navigate('/manage/contests/launch')}
      />
    </div>
  );
};

export default EmptyContestsList;
