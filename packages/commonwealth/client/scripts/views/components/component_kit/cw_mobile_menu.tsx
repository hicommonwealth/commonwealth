/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_mobile_menu.scss';

import app from 'state';
import { getClasses } from './helpers';
import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { ComponentType, MenuItem } from './types';

class CWMobileMenuItem extends ClassComponent<MenuItem> {
  view(vnode: ResultNode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const { disabled, iconLeft, iconRight, isSecondary, label, onClick } =
        vnode.attrs;

      return (
        <div
          className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'MobileMenuItem'
          )}
          onClick={(e) => {
            // Graham TODO 22.10.06: Temporary solution as we transition Notifications
            app.mobileMenu = null;
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
    } else if (vnode.attrs.type === 'header') {
      return (
        <div className="MobileMenuItem">
          <CWText type="caption">{vnode.attrs.label}</CWText>
        </div>
      );
    } else if (vnode.attrs.type === 'notification') {
      const { hasUnreads, iconLeft, iconRight, label, onClick } = vnode.attrs;

      return (
        <div
          className="MobileMenuItem"
          onClick={(e) => {
            // Graham TODO 22.10.06: Temporary solution as we transition Notifications
            app.mobileMenu = null;
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
  }
}

type MobileMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onClick: (e) => void };
  menuItems: Array<MenuItem>;
};

export class CWMobileMenu extends ClassComponent<MobileMenuAttrs> {
  view(vnode: ResultNode<MobileMenuAttrs>) {
    const { className, menuHeader, menuItems } = vnode.attrs;

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
        {menuItems.map((item) => (
          <CWMobileMenuItem type={item.type || 'default'} {...item} />
        ))}
      </div>
    );
  }
}
