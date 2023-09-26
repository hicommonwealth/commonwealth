import React from 'react';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const UpdateCommunityGroupPage = () => {
  // TODO: we will get these values from existing group data
  const initialValues = {
    groupName: 'Ninja Turtles',
    groupDescription: 'This is a group for turtles that became a ninja',
    requirements: [
      {
        requirementAmount: '11',
        requirementChain: {
          label: 'Ethereum',
          value: 'Ethereum',
        },
        requirementCondition: {
          label: 'More than',
          value: 'More than',
        },
        requirementContractAddress: '1234567ugcvy',
        requirementType: {
          label: 'ERC-20',
          value: 'ERC-20',
        },
      },
    ],
    topics: [
      {
        label: 'Change Log',
        value: 'Change Log',
      },
      {
        label: 'Communities',
        value: 'Communities',
      },
    ],
  };

  return (
    <GroupForm
      formType="edit"
      initialValues={initialValues}
      onSubmit={(values) => {
        // TODO: submit api here
        console.log('values => ', values);
      }}
    />
  );
};

export default UpdateCommunityGroupPage;
