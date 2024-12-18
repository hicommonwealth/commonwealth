import clsx from 'clsx';
import React from 'react';

import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from 'state/ui/language/constants';
import useLanguageStore from 'state/ui/language/language';
import useSidebarStore from 'state/ui/sidebar';
import KnockNotifications from 'views/components/KnockNotifications';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CreateContentPopover } from 'views/menus/CreateContentMenu';
import { HelpMenuPopover } from 'views/menus/help_menu';

import UserDropdown from './UserDropdown';

import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import AuthButtons from 'views/components/SublayoutHeader/AuthButtons';
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
  const languageEnabled = useFlag('languageSelector');
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  };

  const languageOptions: DropdownItemType<SupportedLanguage>[] = Object.entries(
    SUPPORTED_LANGUAGES,
  ).map(([code, lang]) => ({
    label: (
      <div className="flag-abbr">
        <span>{lang.flag}</span>
        <span className="abbr">{lang.abbr}</span>
      </div>
    ),
    value: code as SupportedLanguage,
    selected: selectedLanguage === code,
  }));

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
            {languageEnabled && (
              <CWDropdown
                containerClassName="language-selector"
                label={
                  <div className="flag-abbr">
                    <span>{SUPPORTED_LANGUAGES[selectedLanguage].flag}</span>
                  </div>
                }
                options={languageOptions}
                onSelect={(item) => setSelectedLanguage(item.value)}
              />
            )}
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
