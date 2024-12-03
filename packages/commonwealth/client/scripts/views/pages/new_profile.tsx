import React from 'react';

import './new_profile.scss';

import Profile from '../components/Profile';

const NewProfile = ({ userId }: { userId: number }) => {
  return <Profile userId={+userId} />;
};

export default NewProfile;
