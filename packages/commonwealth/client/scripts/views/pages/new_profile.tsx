import React from 'react';

import './new_profile.scss';

import Profile from '../components/Profile';
import { PageNotFound } from './404';

const NewProfile = ({ userId }: { userId: number }) => {
  const _userId = parseInt(`${userId || 0}`);

  if (!_userId) {
    return <PageNotFound />;
  }

  return <Profile userId={+userId} />;
};

export default NewProfile;
