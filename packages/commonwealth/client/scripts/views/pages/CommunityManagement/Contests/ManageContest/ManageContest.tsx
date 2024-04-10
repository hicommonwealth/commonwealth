import React from 'react';

import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import app from 'state';
import Permissions from 'utils/Permissions';
import { PageNotFound } from 'views/pages/404';

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
    <CWPageLayout>
      <div className="ManageContest">
        {editMode ? 'Edit Contest' : 'Create Contest'}
      </div>
    </CWPageLayout>
  );
};

export default ManageContest;
