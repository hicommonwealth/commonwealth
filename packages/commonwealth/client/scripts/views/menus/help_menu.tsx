import React from 'react';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { Modal } from '../components/component_kit/cw_modal';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { FeedbackModal } from '../modals/feedback_modal';

export const HelpMenu = () => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <CWMobileMenu
        className="HelpMenu"
        menuHeader={{
          label: 'Help',
          onClick: () => {
            app.mobileMenu = 'MainMenu';
            app.sidebarRedraw.emit('redraw');
          },
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
      <Modal
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
    <React.Fragment>
      <PopoverMenu
        renderTrigger={(onclick) => (
          <CWIconButton
            iconButtonTheme="black"
            iconName="help"
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
      <Modal
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </React.Fragment>
  );
};
