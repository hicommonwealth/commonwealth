import React from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './NewToolbar.scss';

export const NewToolbar = () => {
  return (
    <div className="NewToolbar">
      <button>
        <CWTooltip
          content="Bold"
          renderTrigger={(handleInteraction) => (
            <CWIconButton
              buttonSize="lg"
              iconName="bold"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        ></CWTooltip>
      </button>
    </div>
  );
};
