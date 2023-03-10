import React from 'react';
import { useNavigate } from 'react-router-dom';

import app from 'state';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';

type EditNewProfileProps = { profileId: string };

const EditNewProfile = (props: EditNewProfileProps) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!app.isLoggedIn()) {
      navigate(`/profile/id/${props.profileId}`);
    }
  }, []);

  return (
    <Sublayout>
      <EditProfileComponent profileId={props.profileId} />
    </Sublayout>
  );
};

export default EditNewProfile;
