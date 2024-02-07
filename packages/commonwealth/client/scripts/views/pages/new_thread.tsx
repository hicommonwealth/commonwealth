import { notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import { NewThreadForm } from '../components/NewThreadForm';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to sign in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate]);

  if (!app.chain) return <PageLoading />;

  return <NewThreadForm />;
};

export default NewThreadPage;
