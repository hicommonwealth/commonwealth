import React, { useEffect, useState } from 'react';

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
  const [mainContentComponents, setMainContentComponents] = useState([]);
  const [cardColumnComponents, setCardColumnComponents] = useState([]);

  useEffect(() => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      navigate('/login', {}, null);
      return;
    }
  }, [navigate]);

  const addComponent = (component, target) => {
    if (target === 'mainContent') {
      setMainContentComponents((prevComponents) => [
        ...prevComponents,
        component,
      ]);
    } else if (target === 'cardColumn') {
      setCardColumnComponents((prevComponents) => [
        ...prevComponents,
        component,
      ]);
    }
  };

  if (!app.chain) return <PageLoading />;

  return (
    <Sublayout>
      <div className="new-thread-page">
        {/* Main Content */}
        <div className="main-content">
          <NewThreadForm />
          {mainContentComponents.map((component, index) => (
            <React.Fragment key={index}>{component}</React.Fragment>
          ))}
        </div>
        {/* Add Action Column */}
        <div className="add-action-column">
          <CWButton
            buttonType="mini-black"
            label="Add Stuff"
            iconLeft="plus"
            className="add-action-button"
            onClick={() => {
              console.log('clicked add action button');
              setRightMenu({
                isVisible: !rightSidebarVisible,
                addComponent: addComponent,
              });
            }}
            disabled={!app.user.activeAccount}
          />
          {cardColumnComponents.map((component, index) => (
            <React.Fragment key={index}>{component}</React.Fragment>
          ))}
        </div>
      </div>
    </Sublayout>
  );
};

export default NewThreadPage;
