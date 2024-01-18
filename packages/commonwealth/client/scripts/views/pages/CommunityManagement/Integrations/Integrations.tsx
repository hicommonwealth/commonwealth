import React from 'react';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import CustomTOS from './CustomTOS';
import CustomURL from './CustomURL';
import Directory from './Directory';
import Discord from './Discord';
import './Integrations.scss';
import Snapshots from './Snapshots';
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
