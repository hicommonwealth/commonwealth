/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { CWPopover, ReactPopover, SharedPopoverAttrs } from './cw_popover';
import {
  ComponentType,
  DefaultMenuItem,
  MenuItem,
  ReactMenuItem,
} from '../types';
import { getClasses } from '../helpers';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';

export class CWPopoverMenuItem extends ClassComponent<MenuItem> {
  view(vnode: ResultNode<MenuItem>) {
    if (vnode.attrs.type === 'header') {
      return (
        <CWText className="menu-section-header-text" type="caption">
          {vnode.attrs.label}
        </CWText>
      );
    } else if (vnode.attrs.type === 'divider') {
      return <div className="menu-section-divider" />;
    } else if (vnode.attrs.type === 'default') {
      const { disabled, isSecondary, iconLeft, label, onClick } = vnode.attrs;
      return (
        <div
          className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'PopoverMenuItem'
          )}
          onClick={onClick}
        >
          {iconLeft && (
            <CWIcon
              className="menu-item-icon"
              iconName={iconLeft}
              iconSize="small"
            />
          )}
          <CWText type="b2" className="menu-item-text">
            {label}
          </CWText>
        </div>
      );
    }
  }
}

type PopoverMenuAttrs = {
  menuItems: Array<MenuItem>;
} & SharedPopoverAttrs;

export class CWPopoverMenu extends ClassComponent<PopoverMenuAttrs> {
  view(vnode: ResultNode<PopoverMenuAttrs>) {
    const { menuItems, trigger } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div className={ComponentType.PopoverMenu}>
            {menuItems.map((item, i) => (
              <CWPopoverMenuItem
                key={`${i}`}
                type={item.type || 'default'}
                {...item}
              />
            ))}
          </div>
        }
        interactionType="click"
        trigger={trigger}
      />
    );
  }
}

export const ReactPopoverMenu = (props: {
  renderTrigger: (onClick: () => void) => React.ReactNode;
  menuItems: Array<ReactMenuItem>;
}) => {
  const [triggerEl, setTriggerEl] = React.useState<null | HTMLElement>(null);

  const handleToggle = (e?: React.MouseEvent<HTMLElement>) => {
    setTriggerEl(triggerEl ? null : e.currentTarget);
  };

  return (
    <React.Fragment>
      {props.renderTrigger(handleToggle)}
      <ReactPopover
        content={
          <div className={ComponentType.PopoverMenu}>
            {props.menuItems.map((item, i) => {
              if (item.type === 'header') {
                return (
                  <CWText
                    className="menu-section-header-text"
                    type="caption"
                    key={i}
                  >
                    {item.label}
                  </CWText>
                );
              } else if (item.type === 'divider') {
                return <div className="menu-section-divider" key={i} />;
              } else {
                const { disabled, isSecondary, iconLeft, label, onClick } =
                  item;
                return (
                  <div
                    className={getClasses<{
                      disabled?: boolean;
                      isSecondary?: boolean;
                    }>({ disabled, isSecondary }, 'PopoverMenuItem')}
                    onClick={(e) => {
                      onClick();
                      handleToggle(e);
                    }}
                    key={i}
                  >
                    {iconLeft && (
                      <CWIcon
                        className="menu-item-icon"
                        iconName={iconLeft}
                        iconSize="small"
                      />
                    )}
                    <CWText type="b2" className="menu-item-text">
                      {label}
                    </CWText>
                  </div>
                );
              }
            })}
          </div>
        }
        anchorEl={triggerEl}
      />
    </React.Fragment>
  );
};
