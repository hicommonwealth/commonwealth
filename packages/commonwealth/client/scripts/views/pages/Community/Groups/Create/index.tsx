import React from 'react';
import app from 'state';
// import { useCreateGroupMutation } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import './index.scss';

const CreateCommunityGroupPage = () => {
  // const { mutateAsync: createGroup } = useCreateGroupMutation();

  if (!app.isLoggedIn() || !Permissions.isCommunityAdmin()) {
    return <PageNotFound />;
  }

  return (
    <GroupForm
      formType="create"
      onSubmit={(values) => {
        // TODO: submit api here
        console.log('values => ', values);
        // createGroup({
        //   chainId: app.activeChainId(),
        //   address: app.user.activeAccount.address,
        // })
        //   .then(x => console.log("x => ", x))
        //   .catch(y => console.log("y => ", y))
      }}
    />
  );
};

export default CreateCommunityGroupPage;
