import React from 'react';
import useSidebarStore from '../../../../state/ui/sidebar/index';
import { CWIconButton } from '../../component_kit/cw_icon_button';
import './CollapsableSidebarButton.scss';

export const CollapsableSidebarButton = ({
  isInsideCommunity,
}: {
  isInsideCommunity: boolean;
}) => {
  const { setMenu, menuName, menuVisible, setUserToggledVisibility } =
    useSidebarStore();

  const cssString = isInsideCommunity ? 'scoped' : 'unscoped';
  let divBoxCss = 'hover-box';
  if (isInsideCommunity && menuVisible) {
    divBoxCss = 'hover-box-expanded';
  }

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setUserToggledVisibility(isVisible ? 'open' : 'closed');
  };

  return (
    <div className="CollapsableSidebarButtonUnscoped">
      <div className={divBoxCss}>
        <CWIconButton
          iconButtonTheme="black"
          iconName="caretDoubleLeft"
          onClick={handleToggle}
          iconSize="small"
          className={
            menuVisible ? `expand-${cssString}` : `collapse-${cssString}`
          }
        />
      </div>
    </div>
  );
};
