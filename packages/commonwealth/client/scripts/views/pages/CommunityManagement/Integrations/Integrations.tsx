import React from 'react';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import CustomTOS from './CustomTOS';
import CustomURL from './CustomURL';
import Directory from './Directory';
import Discord from './Discord';
import './Integrations.scss';
import Snapshots from './Snapshots';
import Stake from './Stake';
import Webhooks from './Webhooks';

const Integrations = () => {
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
        <Stake />
        <Snapshots />
        <Discord />
        <Webhooks />
        <CustomTOS />
        <CustomURL />
      </section>
    </CommunityManagementLayout>
  );
};

export default Integrations;
