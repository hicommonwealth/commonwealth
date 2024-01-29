import React, { useState } from 'react';
import useSidebarStore from '../../../state/ui/sidebar/index';
import { CWIconButton } from '../component_kit/cw_icon_button';

export const RotatingButton = () => {
  const { setMenu, menuName, menuVisible, setUserToggledVisibility } =
    useSidebarStore();

  const [rotate, setRotate] = useState(menuVisible);

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);

    setRotate(!rotate);
  }

  return (
    <div className="rotating-button-hover">
      <div className="rotating-button">
        <CWIconButton
          iconButtonTheme="black"
          iconName="caretDoubleLeft"
          onClick={handleToggle}
          className={rotate ? 'collapse' : 'un-collapse'}
        />
      </div>
    </div>
  );
};
