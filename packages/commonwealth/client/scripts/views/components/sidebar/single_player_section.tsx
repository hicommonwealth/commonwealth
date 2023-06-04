import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SidebarSectionGroup } from './sidebar_section';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { useCommonNavigate } from 'navigation/helpers';
import { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree } from './types';
import app from 'state';

const SinglePlayerSectionComponent = () => {
  const navigate = useCommonNavigate();
  const [profileId, setProfileId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
    const chain =
      typeof activeAccount.chain === 'string'
        ? activeAccount.chain
        : activeAccount.chain?.id;
    const profile = app.newProfiles.getProfile(chain, activeAccount.address);
    setProfileId(profile.id);
    setSelectedAddress(activeAccount.address);
  }, []);

  /*
    // Hack for demonstration purposes, should go to a default creation page (which is unscoped)
    // Should go to a Creation Page Which is instant
  */
  const singlePlayerGroupData: SectionGroupAttrs[] = [
    {
      title: 'Create',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/LilNoun/new/discussion`);
      },
      icon: <CWIcon name="add-circle" iconName="plusCircle" />,
    },
    {
      title: 'Profile',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/profile/id/${profileId}`);
      },
      icon: <CWIcon name="add-circle" iconName="plusCircle" />,
    },
    {
      title: 'Assets',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/profile/id/${profileId}`);
      },
      icon: <CWIcon name="add-circle" iconName="plusCircle" />,
    },
    {
      title: 'Address Book',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        navigate(`/profile/id/${profileId}`);
      },
      icon: <CWIcon name="add-circle" iconName="plusCircle" />,
    },
    {
      title: 'Inbox and Transactions',
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
      navigate(`/dashboard/for-you`);
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
