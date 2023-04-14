import { notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { NewThreadForm } from '../components/new_thread_form/new_thread_form';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate]);

  if (!app.chain) return <PageLoading />;

  return (
    <Sublayout>
      <NewThreadForm />
    </Sublayout>
  );
};

export default NewThreadPage;
