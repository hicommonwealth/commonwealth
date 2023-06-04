import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SidebarSectionGroup } from './sidebar_section';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { useCommonNavigate } from 'navigation/helpers';
import { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree } from './types';
import app from 'state';

const SinglePlayerSectionComponent = () => {
  const navigate = useCommonNavigate();

  const singlePlayerGroupData: SectionGroupAttrs[] = [
    {
      title: 'Create Something',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/new/discussion`);
      },
      icon: <CWIcon name="add-circle" iconName="plusCircle" />,
    },
    {
      title: 'Inbox',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/notifications`);
      },
      icon: <CWIcon name="notifications" iconName="mail" />,
    },
  ];

  const singlePlayerDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-single-player-toggle-tree`] || '{}'
  );

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Home',
    className: 'SinglePlayerSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      localStorage[`${app.activeChainId()}-single-player-toggle-tree`] =
        JSON.stringify({
          toggledState: toggle,
          children: toggleTreeState.children,
        });
    },
    displayData: singlePlayerGroupData,
    isActive: false,
    toggleDisabled: false,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};

export const SinglePlayerSection = SinglePlayerSectionComponent;
