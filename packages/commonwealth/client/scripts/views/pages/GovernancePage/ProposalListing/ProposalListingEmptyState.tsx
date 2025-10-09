import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import './ProposalListingEmptyState.scss';

const ProposalListingEmptyState = () => {
  const navigate = useCommonNavigate();

  const handleGoToIntegrations = () => {
    navigate('/manage/integrations');
  };

  return (
    <div className="ProposalListingEmptyState">
      <div className="empty-state-content">
        <CWText type="h4" fontWeight="semiBold" className="empty-state-title">
          No proposals found
        </CWText>
        <CWText type="b2" className="empty-state-description">
          No proposals found. Click below to link governance tooling or go to
          the integrations page.
        </CWText>
        <CWButton
          label="See all integrations"
          buttonType="primary"
          buttonHeight="sm"
          onClick={handleGoToIntegrations}
        />
      </div>
    </div>
  );
};

export default ProposalListingEmptyState;
