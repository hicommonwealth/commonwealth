import React from 'react';
import useUserStore from 'state/ui/user';
import EditProfileComponent from '../components/EditProfile';
import { PageNotFound } from '../pages/404';

const EditNewProfile = () => {
  const user = useUserStore();

  if (!user.isLoggedIn) {
    return (
      <PageNotFound message="You must be signed in to edit your profile." />
    );
  }

  return <EditProfileComponent />;
};

export default EditNewProfile;
