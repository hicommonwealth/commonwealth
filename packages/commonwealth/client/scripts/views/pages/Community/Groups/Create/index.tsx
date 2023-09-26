import React from 'react';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const CreateCommunityGroupPage = () => {
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
