import React from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const CreateCommunityGroupPage = () => {
  if (!app.isLoggedIn() || !Permissions.isCommunityAdmin()) {
    return <PageNotFound />;
  }

  return (
    <GroupForm
      formType="create"
      onSubmit={(values) => {
        // TODO: submit api here
        console.log('values => ', values);
      }}
    />
  );
};

export default CreateCommunityGroupPage;
