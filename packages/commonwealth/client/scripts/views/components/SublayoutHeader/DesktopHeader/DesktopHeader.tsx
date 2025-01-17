import clsx from 'clsx';
import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import KnockNotifications from 'views/components/KnockNotifications';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CreateContentPopover } from 'views/menus/CreateContentMenu';
import { HelpMenuPopover } from 'views/menus/help_menu';

import UserDropdown from './UserDropdown';

import {
  SUPPORTED_LANGUAGES,
  getLanguageLabel,
  getLanguagePreference,
  setLanguagePreference,
} from 'helpers/languagePreference';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import AuthButtons from 'views/components/SublayoutHeader/AuthButtons';
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';
import { AuthModalType } from 'views/modals/AuthModal';
import './DesktopHeader.scss';

interface DesktopHeaderProps {
  onMobile: boolean;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

const DesktopHeader = ({ onMobile, onAuthModalOpen }: DesktopHeaderProps) => {
  const navigate = useCommonNavigate();
  const { menuVisible, setMenu, menuName, setUserToggledVisibility } =
    useSidebarStore();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  };

  return (
    <div className="DesktopHeader">
      <div className="header-left">
        <CWIconButton
          iconName="commonLogo"
          iconButtonTheme="black"
          iconSize="header"
          onClick={() => {
            if (domain?.isCustomDomain) {
              navigate('/', {}, null);
            } else {
              if (user.isLoggedIn) {
                navigate('/dashboard/for-you', {}, null);
              } else {
                navigate('/dashboard/global', {}, null);
              }
            }
          }}
        />
        {isWindowSmallInclusive(window.innerWidth) && <CWDivider isVertical />}
        {onMobile && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
            onClick={handleToggle}
          />
        )}
      </div>
      <div className="searchbar">
        <CWSearchBar />
      </div>
      <div className="header-right">
        <div
          className={clsx('DesktopMenuContainerParent', {
            isLoggedIn: user.isLoggedIn,
          })}
        >
          <div
            className={clsx('DesktopMenuContainer', {
              isLoggedIn: user.isLoggedIn,
            })}
          >
            <CreateContentPopover />
            <CWTooltip
              content="Explore communities"
              placement="bottom"
              renderTrigger={(handleInteraction) => (
                <CWIconButton
                  iconButtonTheme="black"
                  iconName="compassPhosphor"
                  onClick={() => navigate('/communities', {}, null)}
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                />
              )}
            />

            <HelpMenuPopover />
          </div>
          {user.isLoggedIn && <KnockNotifications />}
        </div>

        <div className="language-selector">
          <CWDropdown
            options={SUPPORTED_LANGUAGES}
            initialValue={{
              label: getLanguageLabel(getLanguagePreference()),
              value: getLanguagePreference(),
            }}
            onSelect={(item) => {
              setLanguagePreference(item.value);
            }}
          />
        </div>
        {user.isLoggedIn && (
          <UserDropdown onAuthModalOpen={() => onAuthModalOpen()} />
        )}

        {!user.isLoggedIn && (
          <AuthButtons
            smallHeightButtons
            onButtonClick={(selectedType) => onAuthModalOpen(selectedType)}
          />
        )}
      </div>
    </div>
  );
};

export default DesktopHeader;
