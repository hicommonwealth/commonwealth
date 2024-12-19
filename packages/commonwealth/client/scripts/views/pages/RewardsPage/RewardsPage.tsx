import React from 'react';

import { CWText } from '../../components/component_kit/cw_text';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';

import useUserStore from 'state/ui/user';

import './RewardsPage.scss';

const RewardsPage = () => {
  const user = useUserStore();

  if (!user.isLoggedIn) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="RewardsPage">
        <CWText type="h2" className="header">
          Rewards
        </CWText>
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
