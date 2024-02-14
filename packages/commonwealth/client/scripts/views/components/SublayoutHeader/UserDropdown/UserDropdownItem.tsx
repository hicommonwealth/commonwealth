import clsx from 'clsx';
import { formatAddressShort } from 'helpers';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import './UserDropdownItem.scss';

interface UserDropdownItemProps {
  username?: string;
  address?: string;
  isSignedIn: boolean;
  hasJoinedCommunity: boolean;
}
export const UserDropdownItem = ({
  username,
  address,
  isSignedIn,
  hasJoinedCommunity,
}: UserDropdownItemProps) => {
  return (
    <div className={clsx('UserDropdownItem', { isSignedIn })}>
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
