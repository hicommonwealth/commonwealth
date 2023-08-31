import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import useSidebarStore from 'state/ui/sidebar';
import 'SublayoutHeader.scss';
import { HelpMenuPopover } from 'views/menus/help_menu';
import app, { initAppState } from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import {
  isWindowMediumSmallInclusive,
  isWindowSmallInclusive,
} from './components/component_kit/helpers';
import { LoginSelector } from './components/Header/LoginSelector';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';
import { featureFlags } from 'helpers/feature-flags';
import UserDropdown from 'views/components/Header/UserDropdown/UserDropdown';
import { Modal } from 'views/components/component_kit/cw_modal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setDarkMode } from 'helpers/darkMode';
import WebWalletController from 'controllers/app/web_wallets';
import { WalletId } from 'common-common/src/types';
import axios from 'axios';
import clsx from 'clsx';
import { CWButton } from 'views/components/component_kit/cw_button';
import { LoginModal } from 'views/modals/login_modal';

type SublayoutHeaderProps = {
  onMobile: boolean;
};

export const SublayoutHeader = ({ onMobile }: SublayoutHeaderProps) => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const navigate = useCommonNavigate();
  const { menuVisible, setMenu, menuName, setMobileMenuName, mobileMenuName } =
    useSidebarStore();
  const { isLoggedIn } = useUserLoggedIn();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const resetWalletConnectSession = async () => {
    /**
     * Imp to reset wc session on logout as subsequent login attempts fail
     */
    const walletConnectWallet = WebWalletController.Instance.getByName(
      WalletId.WalletConnect
    );
    await walletConnectWallet.reset();
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${app.serverUrl()}/logout`);
      await initAppState();
      await resetWalletConnectSession();
      notifySuccess('Logged out');
      setDarkMode(false);
    } catch (err) {
      notifyError('Something went wrong during logging out.');
      window.location.reload();
    }
  };

  return featureFlags.sessionKeys ? (
    <>
      <div className="SublayoutHeader">
        <div className="header-left">
          <CWIconButton
            iconName="commonLogo"
            iconButtonTheme="black"
            iconSize="xl"
            onClick={() => {
              if (app.isCustomDomain()) {
                navigate('/', {}, null);
              } else {
                navigate('/dashboard/for-you', {}, null);
              }
            }}
          />
          {isWindowSmallInclusive(window.innerWidth) && (
            <CWDivider isVertical />
          )}
          {(!isWindowSmallInclusive(window.innerWidth) || !menuVisible) &&
            app.activeChainId() && (
              <CWCommunityAvatar
                size="large"
                community={app.chain.meta}
                onClick={() => {
                  navigate('/discussions');
                }}
              />
            )}
          {onMobile && app.activeChainId() && (
            <CWIconButton
              iconButtonTheme="black"
              iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
              onClick={() => {
                setMenu({ name: menuName, isVisible: !menuVisible });
              }}
            />
          )}
        </div>
        <SearchBar />
        <div className="header-right">
          <div className="MobileMenuContainer">
            <CWIconButton
              iconName="dotsVertical"
              iconButtonTheme="black"
              onClick={() => {
                setMenu({ name: menuName, isVisible: false });
                setMobileMenuName(mobileMenuName ? null : 'MainMenu');
              }}
            />
          </div>
          <div
            className={clsx('DesktopMenuContainer', 'session-keys', {
              isLoggedIn,
            })}
          >
            <CreateContentPopover />
            <CWIconButton
              iconButtonTheme="black"
              iconName="compassPhosphor"
              onClick={() => navigate('/communities', {}, null)}
            />
            <CWIconButton
              iconButtonTheme="black"
              iconName="question"
              onClick={() => setIsFeedbackModalOpen(true)}
            />
            <CWIconButton
              iconButtonTheme="black"
              iconName="bookOpen"
              onClick={() =>
                window.open('https://docs.commonwealth.im/commonwealth/')
              }
            />
            {isLoggedIn && !onMobile && <NotificationsMenuPopover />}
          </div>
          {isLoggedIn && <UserDropdown />}
          {isLoggedIn && (
            <CWIconButton
              className="logout-button"
              iconButtonTheme="black"
              iconName="signOut"
              onClick={handleLogout}
            />
          )}
          {!isLoggedIn && (
            <CWButton
              buttonType="tertiary-black"
              iconLeft="person"
              label="Log in"
              onClick={() => setIsLoginModalOpen(true)}
            />
          )}
        </div>
      </div>
      <Modal
        content={
          <FeedbackModal onModalClose={() => setIsFeedbackModalOpen(false)} />
        }
        onClose={() => setIsFeedbackModalOpen(false)}
        open={isFeedbackModalOpen}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  ) : (
    <div className="SublayoutHeader">
      <div className="header-left">
        <CWIconButton
          iconName="commonLogo"
          iconButtonTheme="black"
          iconSize="xl"
          onClick={() => {
            if (app.isCustomDomain()) {
              navigate('/', {}, null);
            } else {
              navigate('/dashboard/for-you', {}, null);
            }
          }}
        />
        {isWindowSmallInclusive(window.innerWidth) && <CWDivider isVertical />}
        {(!isWindowSmallInclusive(window.innerWidth) || !menuVisible) &&
          app.activeChainId() && (
            <CWCommunityAvatar
              size="large"
              community={app.chain.meta}
              onClick={() => {
                navigate('/discussions');
              }}
            />
          )}
        {onMobile && app.activeChainId() && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
            onClick={() => {
              setMenu({ name: menuName, isVisible: !menuVisible });
            }}
          />
        )}
      </div>
      <SearchBar />
      <div className="header-right">
        <div className="MobileMenuContainer">
          <CWIconButton
            iconName="dotsVertical"
            iconButtonTheme="black"
            onClick={() => {
              setMenu({ name: menuName, isVisible: false });
              setMobileMenuName(mobileMenuName ? null : 'MainMenu');
            }}
          />
        </div>
        <div className="DesktopMenuContainer">
          <CreateContentPopover />
          <HelpMenuPopover />
          {isLoggedIn && !onMobile && <NotificationsMenuPopover />}
        </div>
        <LoginSelector />
      </div>
    </div>
  );
};
