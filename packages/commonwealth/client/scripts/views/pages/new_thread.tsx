import { notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import useUserStore from 'state/ui/user';
import { NewThreadForm } from '../components/NewThreadForm';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();

  console.log('FIXME: here at least in NewThreadPage');

  const user = useUserStore();

  useEffect(() => {
    if (!user.isLoggedIn) {
      notifyInfo('You need to sign in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate, user.isLoggedIn]);

  console.log('FIXME2: here at least in NewThreadPage');

  // if (!app.chain) return <PageLoading />;

  console.log('FIXME3: here at least in NewThreadPage');

  return <NewThreadForm />;
};

export default NewThreadPage;
