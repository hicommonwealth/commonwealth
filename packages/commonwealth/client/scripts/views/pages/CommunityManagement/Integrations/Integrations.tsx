import { ChainBase } from '@hicommonwealth/shared';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import app from 'state';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import CustomTOS from './CustomTOS';
import CustomURL from './CustomURL';
import Directory from './Directory';
import Discord from './Discord';
import './Integrations.scss';
import OnchainVerification from './OnchainVerification';
import Snapshots from './Snapshots';
import SpamLevel from './SpamLevel';
import Stake from './Stake';
import Token from './Token';
import Tokenization from './Tokenization';
import Webhooks from './Webhooks';

const Integrations = () => {
  const showSnapshotIntegration = app.chain.meta.base === ChainBase.Ethereum;

  const isJudgementEnabled = useFlag('judgeContest');

  return (
    <CommunityManagementLayout
      title="Integrations"
      description="Connect your apps to manage your community across channels"
      featureHint={{
        title: 'Everything in one place',
        description: `
         You can link to your projects custom terms of service page. 
         You can also contact us to create a custom URL that points to your Common community.
            `,
      }}
    >
      <section className="Integrations">
        <Directory />
        <SpamLevel />
        <Token />
        {isJudgementEnabled && <OnchainVerification />}
        <Stake />
        {showSnapshotIntegration && <Snapshots />}
        <Tokenization />
        <Discord />
        <Webhooks />
        <CustomTOS />
        <CustomURL />
      </section>
    </CommunityManagementLayout>
  );
};

export default Integrations;
