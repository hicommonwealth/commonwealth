import React from 'react';

import 'pages/new_profile.scss';

import Sublayout from '../sublayout';
import ProfileComponent from '../components/profile';

type NewProfileAttrs = {
  username: string;
};

const NewProfile = (props: NewProfileAttrs) => {
  return (
    <Sublayout>
      <div className="NewProfilePage">
        <ProfileComponent username={props.username} />
      </div>
    </Sublayout>
  );
};

export default NewProfile;
