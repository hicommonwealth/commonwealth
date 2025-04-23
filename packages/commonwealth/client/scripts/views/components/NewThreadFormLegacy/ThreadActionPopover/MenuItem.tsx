import React from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './MenuItem.scss';

const MenuItem = ({
  icon,
  title,
  subtext,
  buttonText,
  isAdded,
  onAdd,
}: any) => {
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
        {isAdded ? (
          <CWIcon
            iconName="check"
            iconSize="small"
            className="caret-icon"
            weight="light"
          />
        ) : (
          <>
            <CWButton
              containerClassName="dismissBtn"
              buttonType="tertiary"
              buttonWidth="narrow"
              buttonHeight="sm"
              onClick={onAdd}
              label={buttonText}
            />
          </>
        )}
      </div>
      <CWText type="b2" fontWeight="regular">
        {subtext}
      </CWText>
    </div>
  );
};

export default MenuItem;
