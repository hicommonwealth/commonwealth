import React from 'react';
import app from 'state';
import EditProfileComponent from '../components/edit_profile';
import { PageNotFound } from '../pages/404';

const EditNewProfile = () => {
  if (!app.isLoggedIn()) {
    return (
      <PageNotFound message="You must be signed in to edit your profile." />
    );
  }

  return <EditProfileComponent />;
};

export default EditNewProfile;
