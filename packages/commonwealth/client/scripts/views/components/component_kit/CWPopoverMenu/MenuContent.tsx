import clsx from 'clsx';
import React from 'react';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';
import { ComponentType } from 'views/components/component_kit/types';

interface MenuContentProps {
  className?: string;
  menuItems: Array<PopoverMenuItem>;
  handleInteraction?: (e: React.MouseEvent<AnchorType>) => void;
}

const MenuContent = ({
  className,
  menuItems,
  handleInteraction,
}: MenuContentProps) => {
  return (
    <div className={clsx(ComponentType.PopoverMenu, className)}>
      {menuItems.map((item, i) => {
        if (item.type === 'header') {
          return (
            <CWText
              className={clsx('menu-section-header-text', item.className)}
              type="caption"
              key={i}
            >
              {item.label}
            </CWText>
          );
        }

        if (item.type === 'divider') {
          return (
            <div
              className={clsx('menu-section-divider', item.className)}
              key={i}
            />
          );
        }

        const {
          disabled,
          isSecondary,
          iconLeft,
          iconLeftWeight,
          iconLeftSize,
          label,
          onClick,
          isButton,
        } = item;

        const clickHandler = (e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(e);

          if (item.type === 'default' && item.preventClosing) {
            return;
          }

          handleInteraction?.(e);
        };

        if (isButton) {
          return (
            <CWButton
              containerClassName={clsx('m-auto no-outline', className)}
              key={label as string}
              label={label}
              buttonHeight="sm"
              iconLeft={iconLeft}
              iconLeftWeight={iconLeftWeight}
              disabled={disabled}
              onClick={clickHandler}
            />
          );
        }

        return (
          <div
            className={clsx('PopoverMenuItem', item.className, {
              disabled,
              isSecondary,
            })}
            onClick={clickHandler}
            key={i}
          >
            {iconLeft && (
              <CWIcon
                className="menu-item-icon"
                iconName={iconLeft}
                iconSize={iconLeftSize || 'small'}
                weight={iconLeftWeight}
              />
            )}
            <CWText type="b2" className="menu-item-text">
              {label}
            </CWText>
          </div>
        );
      })}
    </div>
  );
};

export default MenuContent;
