import React from 'react';

import 'components/sidebar/sidebar_quick_switcher.scss';

import ChainInfo from '../../../models/ChainInfo';

import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWDivider } from '../component_kit/cw_divider';
import { CWIconButton } from '../component_kit/cw_icon_button';

export const SidebarQuickSwitcher = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const { setMenu, menuVisible, menuName, setUserToggledVisibility } =
    useSidebarStore();

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  }

  const allCommunities = app.config.chains
    .getAll()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(
      (item) => !!item.node, // only chains with nodes
    );

  const starredCommunities = allCommunities.filter((item) => {
    // filter out non-starred communities
    return !(
      item instanceof ChainInfo && !app.user.isCommunityStarred(item.id)
    );
  });

  return (
    <div className="SidebarQuickSwitcher">
      <div className="community-nav-bar">
        {!app.activeChainId() && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={menuVisible ? 'caretDoubleLeft' : 'caretDoubleRight'}
            onClick={handleToggle}
          />
        )}
        {isLoggedIn && (
          <CWIconButton
            iconName="plusCirclePhosphor"
            iconButtonTheme="black"
            onClick={() => {
              setMenu({ name: 'createContent' });
            }}
          />
        )}
        <CWIconButton
          iconName="compassPhosphor"
          iconButtonTheme="black"
          onClick={() => {
            setMenu({ name: 'exploreCommunities' });
          }}
        />
      </div>
      <CWDivider />
      <div className="scrollable-community-bar">
        {starredCommunities.map((item) => (
          <CWCommunityAvatar
            key={item.id}
            size="large"
            community={item}
            onClick={() =>
              navigateToCommunity({ navigate, path: '', chain: item.id })
            }
          />
        ))}
      </div>
    </div>
  );
};
