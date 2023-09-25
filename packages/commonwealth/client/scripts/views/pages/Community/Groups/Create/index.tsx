import React from 'react';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const CreateCommunityGroupPage = () => {
  return (
    <GroupForm
      formType="create-group"
      onSubmit={(values) => {
        // TODO: submit api here
      }}
    />
  );
};

export default CreateCommunityGroupPage;
