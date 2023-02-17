import React from 'react';
import { useNavigate } from 'react-router-dom';

import app from 'state';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';

type EditNewProfileProps = { username: string };

const EditNewProfile = (props: EditNewProfileProps) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!app.isLoggedIn()) {
      navigate(`/profile/${props.username}`);
    }
  }, []);

  return (
    <Sublayout>
      <EditProfileComponent username={props.username} />
    </Sublayout>
  );
};

export default EditNewProfile;
