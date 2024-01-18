import React from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from '../../404';
import Form from './Form';
import './Profile.scss';

const CommunityProfile = () => {
  if (
    !app?.user?.activeAccount?.address ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <section className="CommunityProfile">
      <section className="left-section">
        <div className="header">
          <CWText type="h2">Community Profile</CWText>
          <CWText type="b1">Manage the basic details of your community</CWText>
        </div>

        <Form />
      </section>

      <section className="right-section">
        <FeatureHint
          title="URL vs Namespace"
          hint={`
          Your community URL is the web2.0 link to your Common space online. 
          The namespace is the web3.0 equivalent where you can point to your community on-chain. 
          You can purchase additional community namespaces.
        `}
        />
      </section>
    </section>
  );
};

export default CommunityProfile;
