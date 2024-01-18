import React from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from '../../404';
import CustomTOS from './CustomTOS';
import CustomURL from './CustomURL';
import Directory from './Directory';
import Discord from './Discord';
import './Integrations.scss';
import Snapshots from './Snapshots';
import Webhooks from './Webhooks';

const Integrations = () => {
  if (
    !app?.user?.activeAccount?.address ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <section className="Integrations">
      <section className="left-section">
        <div className="header">
          <CWText type="h2">Integrations</CWText>
          <CWText type="b1">
            Connect your apps to manage your community across channels
          </CWText>
        </div>

        <section className="list">
          <Directory />
          <Snapshots />
          <Discord />
          <Webhooks />
          <CustomTOS />
          <CustomURL />
        </section>
      </section>

      <section className="right-section">
        <FeatureHint
          title="Everything in one place"
          hint={`
          You can link to your projects custom terms of service page. 
          You can also contact us to create a custom URL that points to your Common community.
        `}
        />
      </section>
    </section>
  );
};

export default Integrations;
