import React from 'react';

import 'pages/new_profile.scss';

import Profile from '../components/Profile';

type NewProfileAttrs = {
  profileId: string;
};

const NewProfile = (props: NewProfileAttrs) => {
  return <Profile profileId={props.profileId} />;
};

export default NewProfile;
