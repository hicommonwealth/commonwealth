import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import app from 'client/scripts/state';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import './GovernanceMember.scss';

const GovernanceMember = () => {
  const navigate = useCommonNavigate();

  const memberCount = app?.chain?.meta?.profile_count;

  return (
    <div className="GovernanceMemberCard">
      <div className="member-header">
        <CWText fontWeight="medium" type="h5">
          Members
        </CWText>
        <CWText className="link" onClick={() => navigate('/members')}>
          See All
        </CWText>
      </div>
      <CWText fontWeight="semiBold" type="h1">
        {memberCount}
      </CWText>
      <CWText fontWeight="regular">Delegates</CWText>
      <CWText fontWeight="regular">token holders</CWText>
    </div>
  );
};

export default GovernanceMember;
