import React, { useEffect } from 'react';

import { notifyInfo } from 'controllers/app/notifications';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/Sublayout';
import { NewThreadForm } from '../components/NewThreadForm';
import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import { CWButton } from '../components/component_kit/cw_button';

import 'pages/new_thread.scss';

const NewThreadPage = () => {
  const navigate = useCommonNavigate();
  const { rightSidebarVisible, setRightMenu } = useSidebarStore();

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
      <div className="new-thread-page">
        <div className="new-thread-form">
          <NewThreadForm />
        </div>
        <div className="add-action-column">
          <CWButton
            buttonType="mini-black"
            label="Add Action"
            iconLeft="plus"
            className="add-action-button"
            onClick={() => {
              setRightMenu({ isVisible: !rightSidebarVisible });
            }}
            disabled={!app.user.activeAccount}
          />
        </div>
      </div>
    </Sublayout>
  );
};

export default NewThreadPage;
