import React from 'react';

import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { FeedbackModal } from '../modals/feedback_modal';
import { CWModal } from '../components/component_kit/new_designs/CWModal';
import useSidebarStore from 'state/ui/sidebar';
import { featureFlags } from 'helpers/feature-flags';

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
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </React.Fragment>
  );
};

export const HelpMenuPopover = () => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      <PopoverMenu
        renderTrigger={(onclick) => (
          <CWIconButton
            iconButtonTheme="black"
            iconName={featureFlags.sessionKeys ? 'question' : 'help'}
            onClick={onclick}
          />
        )}
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
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
