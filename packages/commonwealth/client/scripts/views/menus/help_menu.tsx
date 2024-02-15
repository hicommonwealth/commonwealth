import React from 'react';

import useSidebarStore from 'state/ui/sidebar';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { CWModal } from '../components/component_kit/new_designs/CWModal';
import { FeedbackModal } from '../modals/feedback_modal';

export const HelpMenu = () => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const { setMobileMenuName } = useSidebarStore();

  return (
    <React.Fragment>
      <CWMobileMenu
        className="HelpMenu"
        menuHeader={{
          label: 'Help',
          onClick: () => setMobileMenuName('MainMenu'),
        }}
        menuItems={[
          {
            label: 'Send Feedback',
            onClick: () => setIsModalOpen(true),
          },
          {
            label: 'Help',
            onClick: () =>
              window.open('https://docs.commonwealth.im/commonwealth/'),
          },
        ]}
      />
      <CWModal
        size="small"
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </React.Fragment>
  );
};

interface HelpMenuPopoverProps {
  onFeedbackModalOpen: (open: boolean) => void;
}

export const HelpMenuPopover = ({
  onFeedbackModalOpen,
}: HelpMenuPopoverProps) => {
  return (
    <>
      <PopoverMenu
        menuItems={[
          {
            label: 'Help documentation',
            onClick: () =>
              window.open('https://docs.commonwealth.im/commonwealth/'),
          },
          {
            label: 'Send feedback',
            onClick: () => onFeedbackModalOpen(true),
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
