import clsx from 'clsx';
import React from 'react';

import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
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
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const handleCreateThread = () => {
    navigate('/new/discussion');
  };

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  const createThreadDisabled = !isLoggedIn || !hasJoinedCommunity;

  return (
    <div className="CreateContentDrawer">
      <div className="left-side">
        <CWText className="header" fontWeight="medium" type="caption">
          Create within Community
        </CWText>
        <div
          className={clsx('item', { disabled: createThreadDisabled })}
          onClick={handleCreateThread}
        >
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
