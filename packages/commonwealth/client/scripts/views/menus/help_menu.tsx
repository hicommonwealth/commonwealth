import React from 'react';

import { DOCS_SUBDOMAIN } from '@hicommonwealth/shared';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

export const HelpMenuPopover = () => {
  return (
    <>
      <PopoverMenu
        menuItems={[
          {
            label: 'Help documentation',
            onClick: () =>
              window.open(`https://${DOCS_SUBDOMAIN}/commonwealth/`),
          },
        ]}
        renderTrigger={(onClick, isMenuOpen) => (
          <CWTooltip
            content="Help"
            placement="bottom"
            renderTrigger={(handleInteraction, isTooltipOpen) => (
              <CWIconButton
                iconButtonTheme="black"
                iconName="question"
                onClick={(e) =>
                  handleIconClick({
                    e,
                    isMenuOpen,
                    isTooltipOpen,
                    handleInteraction,
                    onClick,
                  })
                }
                onMouseEnter={(e) => {
                  handleMouseEnter({ e, isMenuOpen, handleInteraction });
                }}
                onMouseLeave={(e) => {
                  handleMouseLeave({
                    e,
                    isTooltipOpen,
                    handleInteraction,
                  });
                }}
              />
            )}
          />
        )}
      />
    </>
  );
};
