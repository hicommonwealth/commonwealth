import React from 'react';

import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

const TooltipsShowcase = () => {
  return (
    <>
      <CWTooltip
        content="hey"
        renderTrigger={(handleInteraction) => (
          <CWIconButton
            iconButtonTheme="black"
            iconName="compassPhosphor"
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />
      <CWTooltip
        content="hey"
        renderTrigger={(handleInteraction) => (
          <CWIconButton
            iconButtonTheme="black"
            iconName="compassPhosphor"
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />
    </>
  );
};

export default TooltipsShowcase;
