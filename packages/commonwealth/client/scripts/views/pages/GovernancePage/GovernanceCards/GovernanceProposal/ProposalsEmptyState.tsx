import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import './ProposalsEmptyState.scss';

const ProposalsEmptyState = () => {
  const navigate = useCommonNavigate();

  const handleConnectProposals = () => {
    navigate('/manage/integrations');
  };

  return (
    <div className="ProposalsEmptyState">
      <CWText fontWeight="medium" type="h5">
        Proposals
      </CWText>
      <CWText type="caption" className="empty-description">
        There are no proposal tools
      </CWText>
      <CWText type="caption" className="empty-description">
        linked to this community.
      </CWText>
      <CWButton
        buttonType="primary"
        label="Connect Proposals"
        buttonWidth="full"
        onClick={handleConnectProposals}
      />
    </div>
  );
};

export default ProposalsEmptyState;
