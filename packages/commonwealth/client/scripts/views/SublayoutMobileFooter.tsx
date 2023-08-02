import React, { useEffect, useState } from 'react';
import 'SublayoutMobileFooter.scss';
import { HelpMenuPopover } from './menus/help_menu';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { CWCustomIcon } from './components/component_kit/cw_icons/cw_custom_icon';
import { useCommonNavigate } from '../navigation/helpers';
import app from 'state';

export const SublayoutMobileFooter = () => {
  const navigate = useCommonNavigate();
  return (
    <div className="SublayoutMobileFooter">
      <CWIconButton
        iconName="home"
        iconSize="large"
        iconButtonTheme="black"
        onClick={() => navigate('/dashboard/for-you')}
      />
      <CWIconButton
        iconName="search"
        iconSize="large"
        iconButtonTheme="black"
        onClick={() => navigate('/search')}
      />
      {app.isLoggedIn() && (
        <CWCustomIcon
          iconName="unreads"
          iconSize="large"
          onClick={() => navigate('/notifications')}
        />
      )}
      {app.isLoggedIn() && (
        <CWIconButton
          iconName="person"
          iconSize="large"
          iconButtonTheme="black"
          onClick={() => {
            // navigate('/profile/edit');
          }}
        />
      )}
    </div>
  );
};
