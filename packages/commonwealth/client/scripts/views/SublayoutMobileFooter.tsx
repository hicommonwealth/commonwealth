import React, { useEffect, useState } from 'react';
import 'SublayoutMobileFooter.scss';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { CWCustomIcon } from './components/component_kit/cw_icons/cw_custom_icon';
import { useCommonNavigate } from '../navigation/helpers';
import app from 'state';
import useSidebarStore from '../state/ui/sidebar';
import useForceRerender from '../hooks/useForceRerender';
import useUserLoggedIn from '../hooks/useUserLoggedIn';

export const SublayoutMobileFooter = () => {
  const forceRerender = useForceRerender();
  const navigate = useCommonNavigate();

  const { setMenu, menuName, setMobileMenuName, mobileMenuName } =
    useSidebarStore();

  const { isLoggedIn } = useUserLoggedIn();

  return (
    <div className="SublayoutMobileFooter">
      <CWIconButton
        iconName="home"
        iconSize="large"
        iconButtonTheme="black"
        onClick={() => {
          setMobileMenuName(null);
          navigate('/dashboard/for-you', {}, null);
        }}
      />
      <CWIconButton
        iconName="search"
        iconSize="large"
        iconButtonTheme="black"
        onClick={() => {
          setMobileMenuName(null);
          navigate('/search', {}, null);
        }}
      />
      {isLoggedIn && (
        <CWCustomIcon
          iconName="unreads"
          iconSize="large"
          onClick={() => {
            setMobileMenuName(null);
            navigate('/notifications', {}, null);
          }}
        />
      )}
      {isLoggedIn && (
        <CWIconButton
          iconName="person"
          iconSize="large"
          iconButtonTheme="black"
          onClick={() => {
            setMenu({ name: menuName, isVisible: false });
            setMobileMenuName(mobileMenuName ? null : 'MobileMenu');
          }}
        />
      )}
    </div>
  );
};
