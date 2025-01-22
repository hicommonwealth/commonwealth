import clsx from 'clsx';
import React, { useState } from 'react';

import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import KnockNotifications from 'views/components/KnockNotifications';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CreateContentPopover } from 'views/menus/CreateContentMenu';
import { HelpMenuPopover } from 'views/menus/help_menu';

import UserDropdown from './UserDropdown';

import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useLanguagePreferenceStore, {
  SUPPORTED_LANGUAGES,
} from 'state/ui/languagePreference';
import useUserStore from 'state/ui/user';
import AuthButtons from 'views/components/SublayoutHeader/AuthButtons';
import { AuthModalType } from 'views/modals/AuthModal';
import { capDecimals } from 'views/modals/ManageCommunityStakeModal/utils';
import { PopoverMenu } from '../../component_kit/CWPopoverMenu';
import { CWText } from '../../component_kit/cw_text';

import './DesktopHeader.scss';

interface DesktopHeaderProps {
  onMobile: boolean;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

const DesktopHeader = ({ onMobile, onAuthModalOpen }: DesktopHeaderProps) => {
  const navigate = useCommonNavigate();
  const rewardsEnabled = useFlag('rewardsPage');
  const languageSelectorEnabled = useFlag('languageSelectorEnabled');
  const { menuVisible, setMenu, menuName, setUserToggledVisibility } =
    useSidebarStore();

  const { getCurrentLanguage, setLanguage } = useLanguagePreferenceStore();

  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();
  const [isOpen, setIsOpen] = useState(false);

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
            {!isWindowSmallInclusive(window.innerWidth) && (
              <CWTooltip
                content="About Common"
                placement="bottom"
                renderTrigger={(handleInteraction) => (
                  <CWButton
                    buttonType="secondary"
                    buttonHeight="sm"
                    label="About"
                    onClick={() =>
                      window.open('https://landing.common.xyz', '_blank')
                    }
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  />
                )}
              />
            )}
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
          {user.isLoggedIn && (
            <>
              <KnockNotifications />

              {rewardsEnabled && (
                <div className="rewards-button">
                  <CWTooltip
                    content="Wallet and rewards"
                    placement="bottom"
                    renderTrigger={(handleInteraction) => (
                      <div
                        className="rewards-button-container"
                        onClick={() => navigate('/rewards', {}, null)}
                        onMouseEnter={handleInteraction}
                        onMouseLeave={handleInteraction}
                      >
                        <CWIconButton
                          iconName="cardholder"
                          weight="fill"
                          iconButtonTheme="black"
                        />
                        <CWText
                          className="earnings"
                          fontWeight="medium"
                          type="caption"
                        >
                          {capDecimals('0.125')} ETH
                        </CWText>
                      </div>
                    )}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {languageSelectorEnabled && (
          <PopoverMenu
            key={getCurrentLanguage().value}
            className="LanguageSelector"
            placement="bottom-end"
            modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
            menuItems={Object.values(SUPPORTED_LANGUAGES).map((lang) => ({
              type: 'element',
              element: (
                <div
                  className="PopoverMenuItem language-menu-item"
                  onClick={() => {
                    setLanguage(lang);
                    setIsOpen(false);
                  }}
                >
                  <CWText type="b2">{lang.label}</CWText>
                  <CWText>{lang.flag}</CWText>
                </div>
              ),
            }))}
            onOpenChange={(open) => setIsOpen(open)}
            renderTrigger={(onClick) => (
              <button
                className={clsx('LanguageSelectorTriggerButton', { isOpen })}
                onClick={onClick}
              >
                <CWText>{getCurrentLanguage().abbr}</CWText>
                <CWText>{getCurrentLanguage().flag}</CWText>
              </button>
            )}
          />
        )}
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
