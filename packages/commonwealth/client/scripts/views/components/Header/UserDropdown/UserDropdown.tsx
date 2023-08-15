import React, { useEffect, useState } from 'react';
import app from 'state';
import { User } from 'views/components/user/user';

import './UserDropdown.scss';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  PopoverMenu,
  PopoverMenuItem,
} from 'views/components/component_kit/cw_popover/cw_popover_menu';
import clsx from 'clsx';
import {
  CWToggle,
  toggleDarkMode,
} from 'views/components/component_kit/cw_toggle';
import { useCommonNavigate } from 'navigation/helpers';
import { Modal } from 'views/components/component_kit/cw_modal';
import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { UserDropdownItem } from './UserDropdownItem';
import { ChainBase, WalletSsoSource } from 'common-common/src/types';
import { chainBaseToCanvasChainId } from 'canvas';
import { setActiveAccount } from 'controllers/app/login';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';

const UserDropdown = () => {
  const navigate = useCommonNavigate();
  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  const [isOpen, setIsOpen] = useState(false);
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [revalidationModalData, setRevalidationModalData] = useState<{
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }>(null);

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

  const chainBase = app.chain?.base;
  const idOrPrefix =
    chainBase === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix
      : app.chain?.meta.node?.ethChainId;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  useEffect(() => {
    const promises = app.user.activeAccounts.map(async (activeAccount) => {
      const isAuth = await app.sessions
        .getSessionController(chainBase)
        .hasAuthenticatedSession(canvasChainId, activeAccount.address);

      return {
        [activeAccount.address]: isAuth,
      };
    });

    Promise.all(promises).then((response) => {
      const reduced = response.reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});
      setAuthenticatedAddresses(reduced);
    });
  }, [canvasChainId, chainBase]);

  const addresses: PopoverMenuItem[] = app.user.activeAccounts.map(
    (account) => {
      const signed = authenticatedAddresses[account.address];
      const isActive = app.user.activeAccount.address === account.address;

      return {
        type: 'default',
        label: (
          <UserDropdownItem
            isSignedIn={signed}
            hasJoinedCommunity={isActive}
            address={account.address}
          />
        ),
        onClick: async () => {
          if (isActive) {
            return;
          }

          if (signed) {
            return await setActiveAccount(account);
          }

          setRevalidationModalData({
            walletSsoSource: account.walletSsoSource,
            walletAddress: account.address,
          });
        },
      };
    }
  );

  return (
    <>
      <PopoverMenu
        className="UserDropdown"
        placement="bottom-end"
        modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
        menuItems={[
          {
            type: 'header',
            label: 'Addresses',
          },
          ...addresses,
          {
            type: 'default',
            label: 'Connect a new address',
            onClick: () => setIsLoginModalOpen(true),
          },
          { type: 'divider' },
          {
            type: 'header',
            label: 'Settings',
          },
          {
            type: 'default',
            label: 'View profile',
            onClick: () => navigate(`/profile/id/${profileId}`, {}, null),
          },
          {
            type: 'default',
            label: 'Edit profile',
            onClick: () => navigate(`/profile/edit`, {}, null),
          },
          {
            type: 'default',
            label: 'Notifications',
            onClick: () => navigate('/notification-settings', {}, null),
          },
          {
            type: 'default',
            label: (
              <div className="UserDropdownItem">
                <div>Dark mode</div>
                <CWToggle readOnly checked={isDarkModeOn} />
              </div>
            ),
            preventClosing: true,
            onClick: () => toggleDarkMode(!isDarkModeOn, setIsDarkModeOn),
          },
        ]}
        onOpenChange={(open) => setIsOpen(open)}
        renderTrigger={(onClick) => (
          <button
            className={clsx('UserDropdownTriggerButton', { isOpen })}
            onClick={onClick}
          >
            <User avatarSize={24} user={user} />
            <CWIcon
              iconName={isOpen ? 'caretUp' : 'caretDown'}
              iconSize="small"
              className="caret-icon"
              weight="bold"
            />
          </button>
        )}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
      <Modal
        isFullScreen={false}
        content={
          <SessionRevalidationModal
            onModalClose={() => setRevalidationModalData(null)}
            walletSsoSource={revalidationModalData?.walletSsoSource}
            walletAddress={revalidationModalData?.walletAddress}
          />
        }
        onClose={() => setRevalidationModalData(null)}
        open={!!revalidationModalData}
      />
    </>
  );
};

export default UserDropdown;
