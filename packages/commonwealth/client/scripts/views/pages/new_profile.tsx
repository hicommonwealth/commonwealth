import React from 'react';

import 'pages/new_profile.scss';

import Sublayout from '../sublayout';
import ProfileComponent from '../components/profile';

type NewProfileAttrs = {
  profileId: string;
};

const NewProfile = (props: NewProfileAttrs) => {
  return (
    <Sublayout>
      <div className="NewProfilePage">
        <ProfileComponent profileId={props.profileId} />
      </div>
    </Sublayout>
  );
};

export default NewProfile;
