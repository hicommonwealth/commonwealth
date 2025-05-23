import clsx from 'clsx';
import React from 'react';

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

import { ChainBase } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { fetchCachedNodes } from 'client/scripts/state/api/nodes';
import { useFlag } from 'hooks/useFlag';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import AuthButtons from 'views/components/SublayoutHeader/AuthButtons';
import { AuthModalType } from 'views/modals/AuthModal';
import { CWCustomIcon } from '../../component_kit/cw_icons/cw_custom_icon';
import { CWText } from '../../component_kit/cw_text';
import XPProgressIndicator from '../XPProgressIndicator';

import DownloadMobileApp from 'views/components/DownloadMobileApp';
import FormattedDisplayNumber from '../../FormattedDisplayNumber/FormattedDisplayNumber';
import './DesktopHeader.scss';

interface DesktopHeaderProps {
  onMobile: boolean;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

const baseNodeId = 1358;

const DesktopHeader = ({ onMobile, onAuthModalOpen }: DesktopHeaderProps) => {
  const navigate = useCommonNavigate();
  const rewardsEnabled = useFlag('rewardsPage');
  const xpEnabled = useFlag('xp');
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

  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find((node) => node.id === baseNodeId);

  const uniqueAddresses = getUniqueUserAddresses({
    forChain: ChainBase.Ethereum,
  });

  const { data: ethBalance } = useGetUserEthBalanceQuery({
    chainRpc: baseNode?.url || '',
    walletAddress: uniqueAddresses[0] || '',
    ethChainId: baseNode?.ethChainId || 0,
    apiEnabled: !!baseNode && !!uniqueAddresses[0],
  });

  const balance = ethBalance === '0.' ? '0' : ethBalance;

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
        <DownloadMobileApp />
      </div>

      <div></div>
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
            {xpEnabled && <XPProgressIndicator />}
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
              content="Explore"
              placement="bottom"
              renderTrigger={(handleInteraction) => (
                <CWIconButton
                  iconButtonTheme="black"
                  iconName="compassPhosphor"
                  onClick={() => navigate('/explore', {}, null)}
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
                        onClick={() => navigate('/wallet', {}, null)}
                        onMouseEnter={handleInteraction}
                        onMouseLeave={handleInteraction}
                      >
                        <CWIconButton
                          iconName="cardholder"
                          weight="fill"
                          iconButtonTheme="black"
                        />
                        <FormattedDisplayNumber
                          value={balance}
                          options={{ decimals: 3, useShortSuffixes: false }}
                          className="mr-1"
                          type="caption"
                          fontWeight="medium"
                        />
                        <CWText type="caption" className="ml-1">
                          ETH
                        </CWText>
                        <CWCustomIcon iconName="base" iconSize="xs" />
                      </div>
                    )}
                  />
                </div>
              )}
            </>
          )}
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
