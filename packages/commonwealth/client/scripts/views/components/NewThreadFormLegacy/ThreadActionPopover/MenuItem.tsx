import React from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import {
  CustomIconName,
  IconName,
} from '../../component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './MenuItem.scss';

type MenuItemProps = {
  icon: IconName | CustomIconName;
  title: string;
  subtext: string;
  buttonText: string;
  isAdded: boolean;
  onAdd: () => void;
};

const MenuItem = ({
  icon,
  title,
  subtext,
  buttonText,
  isAdded,
  onAdd,
}: MenuItemProps) => {
  return (
    <div className="menu-item">
      <div className="menu-item__header">
        <div className="menu-item__header_left">
          <CWIcon
            iconName={icon}
            iconSize="small"
            className="caret-icon"
            weight="light"
          />
          <CWText type="b2">{title}</CWText>
        </div>
        <div className="menu-item__action">
          {isAdded ? (
            <CWIcon
              iconName="check"
              iconSize="small"
              className="caret-icon"
              weight="light"
              onClick={onAdd}
            />
          ) : (
            <CWButton
              containerClassName="dismissBtn"
              buttonType="tertiary"
              buttonWidth="narrow"
              buttonHeight="sm"
              onClick={onAdd}
              label={buttonText}
            />
          )}
        </div>
      </div>
      <CWText type="b2" fontWeight="regular">
        {subtext}
      </CWText>
    </div>
  );
};

export default MenuItem;
