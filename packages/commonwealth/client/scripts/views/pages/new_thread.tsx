import { notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import useUserStore from 'state/ui/user';
import { NewThreadForm } from '../components/NewThreadForm';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();

  const user = useUserStore();

  useEffect(() => {
    if (!user.isLoggedIn) {
      notifyInfo('You need to sign in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate, user.isLoggedIn]);

  return <NewThreadForm />;
};

export default NewThreadPage;
