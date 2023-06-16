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
  const [hoveredComponentIndex, setHoveredComponentIndex] = useState(null);

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

  const handleRemoveComponent = (indexToRemove, target) => {
    if (target === 'mainContent') {
      setMainContentComponents((prevComponents) =>
        prevComponents.filter((_, index) => index !== indexToRemove)
      );
    } else if (target === 'cardColumn') {
      setCardColumnComponents((prevComponents) =>
        prevComponents.filter((_, index) => index !== indexToRemove)
      );
    }
  };

  const renderComponentWithRemoveIcon = (component, index, target) => (
    <div
      key={index}
      onMouseEnter={() => setHoveredComponentIndex(index)}
      onMouseLeave={() => setHoveredComponentIndex(null)}
      style={{ position: 'relative', paddingTop: '14px' }}
    >
      {hoveredComponentIndex === index && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            cursor: 'pointer',
          }}
          onClick={() => handleRemoveComponent(index, target)}
        >
          x
        </div>
      )}
      {component}
    </div>
  );

  if (!app.chain) return <PageLoading />;

  return (
    <Sublayout>
      <div className="new-thread-page">
        {/* Main Content */}
        <div className="main-content">
          <NewThreadForm />
          {mainContentComponents.map((component, index) =>
            renderComponentWithRemoveIcon(component, index, 'mainContent')
          )}
        </div>
        {/* Add Action Column */}
        <div className="add-action-column" style={{ padding: '24px' }}>
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
          {cardColumnComponents.map((component, index) =>
            renderComponentWithRemoveIcon(component, index, 'cardColumn')
          )}
        </div>
      </div>
    </Sublayout>
  );
};

export default NewThreadPage;
