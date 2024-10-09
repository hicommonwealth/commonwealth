import React from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './NewToolbar.scss';

export const NewToolbar = () => {
  const formattingPopoverProps = usePopover();

  return (
    <div className="NewToolbar">
      <button onClick={formattingPopoverProps.handleInteraction}>
        headings
      </button>

      <CWPopover
        className="FormattingPopover"
        body={
          <div>
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
        }
        {...formattingPopoverProps}
      />
    </div>
  );
};
