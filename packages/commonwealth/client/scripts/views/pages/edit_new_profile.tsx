import React from 'react';

import app from 'state';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';
import { PageNotFound } from '../pages/404';

const EditNewProfile = () => {
  if (!app.isLoggedIn()) {
    return (
      <PageNotFound message="You must be logged in to edit your profile." />
    );
  }

  return (
    <Sublayout>
      <EditProfileComponent />
    </Sublayout>
  );
};

export default EditNewProfile;
