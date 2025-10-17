import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import './TreasuryEmptyState.scss';

const TreasuryEmptyState = () => {
  const navigate = useCommonNavigate();

  const handleConnectTreasury = () => {
    navigate('/manage/integrations');
  };

  return (
    <div className="TreasuryEmptyState">
      <CWText fontWeight="medium" type="h5">
        Treasury
      </CWText>
      <CWText type="caption" className="empty-description">
        There are no treasury sources linked for this community.
      </CWText>
      <CWButton
        buttonType="primary"
        label="Connect Treasury"
        buttonWidth="full"
        onClick={handleConnectTreasury}
      />
    </div>
  );
};

export default TreasuryEmptyState;
