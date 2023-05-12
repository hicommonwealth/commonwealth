import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import WebWalletController from 'controllers/app/web_wallets';
import { WalletId } from 'common-common/src/types';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { redraw } from 'mithrilInterop';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import $ from 'jquery';
import app, { initAppState } from 'state';
import { notifySuccess } from 'controllers/app/notifications';
import { setDarkMode } from 'helpers/darkMode';
import { Modal } from 'views/components/component_kit/cw_modal';
import { FeedbackModal } from 'views/modals/feedback_modal';

import 'components/Header/LoginSelectorMenu.scss';

interface LoginSelectorMenuRightProps {
  onLogout: () => void;
}

export const LoginSelectorMenuRight = ({
  onLogout,
}: LoginSelectorMenuRightProps) => {
  const navigate = useCommonNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );

  const resetWalletConnectSession = async () => {
    /**
     * Imp to reset wc session on logout as subsequent login attempts fail
     */
    const walletConnectWallet = WebWalletController.Instance.getByName(
      WalletId.WalletConnect
    );
    await walletConnectWallet.reset();
  };

  return (
    <>
      <div className="LoginSelectorMenu right">
        <div
          className="login-menu-item"
          onClick={() => navigate('/notification-settings', {}, null)}
        >
          <CWText type="caption">Notification settings</CWText>
        </div>
        <div className="login-menu-item">
          <CWToggle
            checked={isDarkModeOn}
            onChange={(e) => {
              isDarkModeOn
                ? toggleDarkMode(false, setIsDarkModeOn)
                : toggleDarkMode(true, setIsDarkModeOn);
              e.stopPropagation();
              redraw();
            }}
          />
          <div className="login-darkmode-label">
            <CWText type="caption">Dark mode</CWText>
          </div>
        </div>
        <CWDivider />
        <div className="login-menu-item" onClick={() => setIsModalOpen(true)}>
          <CWText type="caption">Send feedback</CWText>
        </div>
        <div
          className="login-menu-item"
          onClick={() => {
            $.get(`${app.serverUrl()}/logout`)
              .then(async () => {
                await initAppState();
                await resetWalletConnectSession();

                notifySuccess('Logged out');
                onLogout();
                setDarkMode(false);
              })
              .catch(() => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
          }}
        >
          <CWText type="caption">Logout</CWText>
        </div>
      </div>
      <Modal
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
