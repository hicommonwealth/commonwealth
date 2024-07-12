import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React from 'react';
import EditProfileComponent from '../components/EditProfile';
import { PageNotFound } from '../pages/404';

const EditNewProfile = () => {
  const { isLoggedIn } = useUserLoggedIn();

  if (!isLoggedIn) {
    return (
      <PageNotFound message="You must be signed in to edit your profile." />
    );
  }

  return <EditProfileComponent />;
};

export default EditNewProfile;
