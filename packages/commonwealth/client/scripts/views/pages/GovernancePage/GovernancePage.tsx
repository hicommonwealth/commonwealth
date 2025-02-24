import { useFlag } from 'client/scripts/hooks/useFlag';
import React, { useRef } from 'react';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import GovernanceHeader from './GovernanceHeader/GovernanceHeader';

import './GovernancePage.scss';

const GovernancePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const governancePageEnabled = useFlag('governancePage');

  if (!governancePageEnabled) return;

  return (
    <CWPageLayout ref={containerRef}>
      <div className="GovernancePage">
        <GovernanceHeader />
      </div>
    </CWPageLayout>
  );
};

export default GovernancePage;
