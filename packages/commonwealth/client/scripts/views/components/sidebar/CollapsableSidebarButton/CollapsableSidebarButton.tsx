import clsx from 'clsx';
import React from 'react';
import useSidebarStore from '../../../../state/ui/sidebar/index';
import { CWIconButton } from '../../component_kit/cw_icon_button';
import './CollapsableSidebarButton.scss';

export const CollapsableSidebarButton = ({
  isInsideCommunity,
  onMobile,
}: {
  isInsideCommunity: boolean;
  onMobile: boolean;
}) => {
  const { setMenu, menuName, menuVisible, setUserToggledVisibility } =
    useSidebarStore();

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setUserToggledVisibility(isVisible ? 'open' : 'closed');
  };

  return (
    <div className={clsx('CollapsableSidebarButton', { onMobile })}>
      <div
        className={clsx('hover-box', {
          expanded: isInsideCommunity && menuVisible,
          collapsed: !menuVisible,
        })}
      >
        <CWIconButton
          iconButtonTheme="neutral"
          iconName="caretDoubleLeft"
          onClick={handleToggle}
          className={clsx('hover-image', {
            'expand-scoped': menuVisible && isInsideCommunity,
            'expand-unscoped': menuVisible && !isInsideCommunity,
            'collapse-scoped': !menuVisible && isInsideCommunity,
            'collapse-unscoped': !menuVisible && !isInsideCommunity,
          })}
        />
      </div>
    </div>
  );
};
