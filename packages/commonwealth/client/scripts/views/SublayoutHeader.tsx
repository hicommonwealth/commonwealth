import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import useSidebarStore from 'state/ui/sidebar';
import 'SublayoutHeader.scss';
import { HelpMenuPopover } from 'views/menus/help_menu';
import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/Header/LoginSelector';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';
import { featureFlags } from 'helpers/feature-flags';
import UserDropdown from 'views/components/Header/UserDropdown/UserDropdown';
import { Modal } from 'views/components/component_kit/cw_modal';
import { FeedbackModal } from 'views/modals/feedback_modal';

type SublayoutHeaderProps = {
  onMobile: boolean;
};

export const SublayoutHeader = ({ onMobile }: SublayoutHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useCommonNavigate();
  const { menuVisible, setMenu, menuName, setMobileMenuName, mobileMenuName } =
    useSidebarStore();
  const { isLoggedIn } = useUserLoggedIn();

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
          <div className="DesktopMenuContainer session-keys">
            <CreateContentPopover />
            <CWIconButton
              iconButtonTheme="black"
              iconName="compassPhosphor"
              onClick={() => navigate('/communities', {}, null)}
            />
            <CWIconButton
              iconButtonTheme="black"
              iconName="question"
              onClick={() => setIsModalOpen(true)}
            />
            <CWIconButton
              iconButtonTheme="black"
              iconName="paperPlaneTilt"
              onClick={() =>
                window.open('https://docs.commonwealth.im/commonwealth/')
              }
            />
            {isLoggedIn && !onMobile && <NotificationsMenuPopover />}
          </div>
          <UserDropdown />
        </div>
      </div>
      <Modal
        content={<FeedbackModal onModalClose={() => setIsModalOpen(false)} />}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
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
