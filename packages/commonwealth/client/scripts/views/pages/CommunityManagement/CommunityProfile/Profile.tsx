import React from 'react';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import CommunityProfileForm from './CommunityProfileForm';

const CommunityProfile = () => {
  return (
    <CommunityManagementLayout
      title="Community Profile"
      description="Manage the basic details of your community"
      featureHint={{
        title: 'URL vs Namespace',
        description: `Your community URL is the web2.0 link to your Common space online. 
          The namespace is the web3.0 equivalent where you can point to your community on-chain. 
          You can purchase additional community namespaces.`,
      }}
    >
      <CommunityProfileForm />
    </CommunityManagementLayout>
  );
};

export default CommunityProfile;
