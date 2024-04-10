import React from 'react';

import app from 'state';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from 'views/pages/404';
import CommunityManagementLayout from 'views/pages/CommunityManagement/common/CommunityManagementLayout';

import './ManageContest.scss';

interface ManageContestProps {
  contestId?: string;
}

const ManageContest = ({ contestId }: ManageContestProps) => {
  const editMode = !!contestId;

  if (
    !app.isLoggedIn() ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <CommunityManagementLayout
      title="Launch a contest"
      description={
        <CWText className="contest-description">
          Launch a contest using the funds from your community wallet to create
          engagement incentives.{' '}
          <CWText fontWeight="medium">Contests last 7 days</CWText> in
          blockchain time. <a href="https://blog.commonwealth.im">Learn more</a>
        </CWText>
      }
      featureHint={{
        title: 'How do I fund my contest?',
        description:
          'Contests are funded when community members purchase stake in the community. ' +
          'Each transaction includes a small contribution to the community pool that can be used to fund contests.',
      }}
    >
      <div className="ManageContest">
        {editMode ? 'Edit Contest' : 'Create Contest'}
      </div>
    </CommunityManagementLayout>
  );
};

export default ManageContest;
