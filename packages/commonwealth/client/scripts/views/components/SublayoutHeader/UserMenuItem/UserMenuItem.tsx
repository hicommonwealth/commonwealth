import clsx from 'clsx';
import React from 'react';

import { formatAddressShort } from 'helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './UserMenuItem.scss';

interface UserMenuItem {
  username?: string;
  address?: string;
  isSignedIn: boolean;
  hasJoinedCommunity: boolean;
}

const UserMenuItem = ({
  username,
  address,
  isSignedIn,
  hasJoinedCommunity,
}: UserMenuItem) => {
  return (
    <div className={clsx('UserMenuItem', { isSignedIn })}>
      <CWText type="b2" className="identification">
        {username || formatAddressShort(address, 6)}
      </CWText>
      {isSignedIn && hasJoinedCommunity && (
        <span className="check-icon">
          <CWIcon iconSize="small" iconName="checkCircleFilled" />
        </span>
      )}
      {!isSignedIn && <CWText type="caption">Signed out</CWText>}
    </div>
  );
};

export default UserMenuItem;
