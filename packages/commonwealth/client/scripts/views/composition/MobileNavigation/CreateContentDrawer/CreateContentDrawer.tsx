import React from 'react';
import app from 'state';

import { notifyInfo } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

import './CreateContentDrawer.scss';

interface CreateContentDrawerProps {
  onClose: () => void;
}

const CreateContentDrawer = ({ onClose }: CreateContentDrawerProps) => {
  const navigate = useCommonNavigate();

  const handleCreateThread = () => {
    // TODO display new thread creation page
    if (!app.activeChainId()) {
      notifyInfo('Go to community page to create a thread');
      return;
    }

    navigate('/new/discussion');
  };

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  return (
    <div className="CreateContentDrawer">
      <div className="left-side">
        <CWText className="header" fontWeight="medium" type="caption">
          Create within Community
        </CWText>
        <div className="item" onClick={handleCreateThread}>
          <CWIcon iconName="pencil" />
          <CWText> Create thread</CWText>
        </div>

        <CWText className="header" fontWeight="medium" type="caption">
          Universal create
        </CWText>
        <div className="item" onClick={handleCreateCommunity}>
          <CWIcon iconName="peopleNew" />
          <CWText>Create community</CWText>
        </div>
      </div>
      <CWIconButton iconName="close" onClick={onClose} />
    </div>
  );
};

export default CreateContentDrawer;
