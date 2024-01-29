import 'components/sidebar/collapsable_button.scss';
import React, { useState } from 'react';
import useSidebarStore from '../../../state/ui/sidebar/index';
import { CWIconButton } from '../component_kit/cw_icon_button';

export const CollapsableSidebarButtonScoped = () => {
  const { setMenu, menuName, menuVisible, setUserToggledVisibility } =
    useSidebarStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);

    setIsCollapsed(!isCollapsed);
  }

  return (
    <CWIconButton
      iconButtonTheme="black"
      iconName="caretDoubleLeft"
      onClick={handleToggle}
      className={isCollapsed ? 'collapse-scoped' : 'un-collapse-scoped'}
    />
  );
};
