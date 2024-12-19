import React from 'react';

import { CWText } from '../../components/component_kit/cw_text';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import RewardsCard from './RewardsCard';

import { useFlag } from 'hooks/useFlag';
import useUserStore from 'state/ui/user';

import './RewardsPage.scss';

const RewardsPage = () => {
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');

  if (!user.isLoggedIn || !rewardsEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="RewardsPage">
        <CWText type="h2" className="header">
          Rewards
        </CWText>
        <div className="rewards-card-container">
          <RewardsCard
            title="Referrals"
            description="Track your referral rewards"
            icon="userSwitch"
            onSeeAllClick={() => console.log('See all clicked')}
          />
          <RewardsCard title="Wallet Balance" icon="cardholder" />
          <RewardsCard
            title="Quests"
            description="XP and tokens earned from your contests, bounties, and posted threads"
            icon="trophy"
            onSeeAllClick={() => console.log('See all clicked')}
          />
        </div>
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
