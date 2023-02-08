/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_mobile_menu.scss';

import app from 'state';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import type { MenuItem } from './types';
import { ComponentType } from './types';

const CWMobileMenuItem = (props: MenuItem) => {
  if (props.type === 'default') {
    const { disabled, iconLeft, iconRight, isSecondary, label, onClick } =
      props;

    return (
      <div
        className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
          { disabled, isSecondary },
          'MobileMenuItem'
        )}
        onClick={(e) => {
          // Graham TODO 22.10.06: Temporary solution as we transition Notifications
          app.mobileMenu = null;
          app.mobileMenuRedraw.emit('redraw');
          onClick(e);
        }}
      >
        <div className="mobile-menu-item-left">
          {iconLeft && <CWIcon iconName={iconLeft} />}
          <CWText type="b2">{label}</CWText>
        </div>
        {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
      </div>
    );
  } else if (props.type === 'header') {
    return (
      <div className="MobileMenuItem">
        <CWText type="caption">{props.label}</CWText>
      </div>
    );
  } else if (props.type === 'notification') {
    const { hasUnreads, iconLeft, iconRight, label, onClick } = props;

    return (
      <div
        className="MobileMenuItem"
        onClick={(e) => {
          // Graham TODO 22.10.06: Temporary solution as we transition Notifications
          app.mobileMenu = null;
          app.mobileMenuRedraw.emit('redraw');
          onClick(e);
        }}
      >
        <div className="mobile-menu-item-left">
          {iconLeft &&
            (hasUnreads ? (
              <CWCustomIcon iconName="unreads" />
            ) : (
              <CWIcon iconName={iconLeft} />
            ))}
          <CWText type="b2">{label}</CWText>
        </div>
        {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
      </div>
    );
  }
};

type MobileMenuProps = {
  className?: string;
  menuHeader?: { label: string; onClick: (e) => void };
  menuItems: Array<MenuItem>;
};

export const CWMobileMenu = (props: MobileMenuProps) => {
  const { className, menuHeader, menuItems } = props;

  return (
    <div
      className={getClasses<{ className: string }>(
        { className },
        ComponentType.MobileMenu
      )}
    >
      {menuHeader && (
        <div className="mobile-menu-header" onClick={menuHeader.onClick}>
          <CWIcon iconName="chevronLeft" />
          <CWText type="h5" fontWeight="medium">
            {menuHeader.label}
          </CWText>
        </div>
      )}
      {menuItems.map((item, i) => (
        <CWMobileMenuItem key={i} type={item.type || 'default'} {...item} />
      ))}
    </div>
  );
};
