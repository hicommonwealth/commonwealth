import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import React from 'react';
import EditProfileComponent from '../components/edit_profile';
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
