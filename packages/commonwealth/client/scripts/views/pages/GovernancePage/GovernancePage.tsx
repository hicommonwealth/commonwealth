import { useFlag } from 'client/scripts/hooks/useFlag';
import React from 'react';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import GovernanceHeader from './GovernanceHeader/GovernanceHeader';

import { PageNotFound } from '../404';
import './GovernancePage.scss';

const GovernancePage = () => {
  const governancePageEnabled = useFlag('governancePage');

  if (!governancePageEnabled) return <PageNotFound />;

  return (
    <CWPageLayout>
      <div className="GovernancePage">
        <GovernanceHeader />
      </div>
    </CWPageLayout>
  );
};

export default GovernancePage;
