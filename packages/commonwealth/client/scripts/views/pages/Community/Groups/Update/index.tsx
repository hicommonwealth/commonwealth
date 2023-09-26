import React from 'react';
import app from 'state';
// import { useEditGroupMutation } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const UpdateCommunityGroupPage = () => {
  // const { mutateAsync: editGroup } = useEditGroupMutation();

  if (!app.isLoggedIn() || !Permissions.isCommunityAdmin()) {
    return <PageNotFound />;
  }

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
        // editGroup({
        //   chainId: app.activeChainId(),
        //   address: app.user.activeAccount.address,
        //   groupId: '1',
        // })
        //   .then(x => console.log("x => ", x))
        //   .catch(y => console.log("y => ", y))
      }}
    />
  );
};

export default UpdateCommunityGroupPage;
