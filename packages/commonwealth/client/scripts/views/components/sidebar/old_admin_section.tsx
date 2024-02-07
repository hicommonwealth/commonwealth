import React from 'react';

import { handleRedirectClicks } from 'helpers';
import { featureFlags } from 'helpers/feature-flags';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { useNewTopicModalStore } from 'state/ui/modals';
import { sidebarStore } from 'state/ui/sidebar';
import { NewTopicModal } from '../../modals/new_topic_modal';
import { OrderTopicsModal } from '../../modals/order_topics_modal';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';

const resetSidebarState = () => {
  if (isWindowSmallInclusive(window.innerWidth)) {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
  } else {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: true });
  }
};

const setAdminToggleTree = (path: string, toggle: boolean) => {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`],
  );

  const split = path.split('.');

  for (const field of split.slice(0, split.length - 1)) {
    if (Object.prototype.hasOwnProperty.call(currentTree, field)) {
      currentTree = currentTree[field];
    } else {
      return;
    }
  }

  currentTree[split[split.length - 1]] = !toggle;

  const newTree = currentTree;

  localStorage[`${app.activeChainId()}-admin-toggle-tree`] =
    JSON.stringify(newTree);
};

const AdminSectionComponent = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const [isOrderTopicsModalOpen, setIsOrderTopicsModalOpen] =
    React.useState<boolean>(false);
  const { isNewTopicModalOpen, setIsNewTopicModalOpen } =
    useNewTopicModalStore();

  const matchesManageCommunityRoute = matchRoutes(
    [{ path: '/manage' }, { path: ':scope/manage' }],
    location,
  );
  const matchesAnalyticsRoute = matchRoutes(
    [{ path: '/analytics' }, { path: ':scope/analytics' }],
    location,
  );
  const matchesContractsRoute = matchRoutes(
    [{ path: '/contracts' }, { path: ':scope/contracts' }],
    location,
  );

  const adminGroupData: SectionGroupAttrs[] = [
    {
      title: 'Manage community',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesManageCommunityRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/manage`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Analytics',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesAnalyticsRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/analytics`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.analytics.toggledState`, toggle);
          },
        );
      },
    },
    ...(featureFlags.proposalTemplates
      ? [
          {
            title: 'Contract action templates',
            containsChildren: false,
            displayData: null,
            hasDefaultToggle: false,
            isActive: !!matchesContractsRoute,
            isVisible: true,
            isUpdated: false,
            onClick: (e, toggle: boolean) => {
              e.preventDefault();
              resetSidebarState();
              handleRedirectClicks(
                navigate,
                e,
                `/contracts`,
                app.activeChainId(),
                () => {
                  setAdminToggleTree(`children.contracts.toggledState`, toggle);
                },
              );
            },
          },
        ]
      : []),
    {
      title: 'New topic',
      isActive: isNewTopicModalOpen,
      isVisible: true,
      containsChildren: false,
      displayData: null,
      isUpdated: false,
      hasDefaultToggle: false,
      onClick: (e) => {
        e.preventDefault();
        resetSidebarState();
        setIsNewTopicModalOpen(true);
      },
    },
    {
      title: 'Order sidebar topics',
      isActive: isOrderTopicsModalOpen,
      isVisible: true,
      containsChildren: false,
      displayData: null,
      isUpdated: false,
      hasDefaultToggle: false,
      onClick: (e) => {
        e.preventDefault();
        resetSidebarState();
        setIsOrderTopicsModalOpen(true);
      },
    },
  ];

  // Build Toggle Tree
  const adminDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  // Check if an existing toggle tree is stored
  if (!localStorage[`${app.activeChainId()}-admin-toggle-tree`]) {
    localStorage[`${app.activeChainId()}-admin-toggle-tree`] = JSON.stringify(
      adminDefaultToggleTree,
    );
  } else if (!verifyCachedToggleTree('admin', adminDefaultToggleTree)) {
    localStorage[`${app.activeChainId()}-admin-toggle-tree`] = JSON.stringify(
      adminDefaultToggleTree,
    );
  }

  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`],
  );

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Admin Capabilities',
    className: 'AdminSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setAdminToggleTree('toggledState', toggle);
    },
    displayData: adminGroupData,
    isActive: true,
    toggleDisabled: false,
  };

  return (
    <React.Fragment>
      <SidebarSectionGroup {...sidebarSectionData} />
      <CWModal
        size="small"
        content={
          <NewTopicModal onModalClose={() => setIsNewTopicModalOpen(false)} />
        }
        onClose={() => setIsNewTopicModalOpen(false)}
        open={isNewTopicModalOpen}
      />
      <CWModal
        size="small"
        content={
          <OrderTopicsModal
            onModalClose={() => setIsOrderTopicsModalOpen(false)}
          />
        }
        onClose={() => setIsOrderTopicsModalOpen(false)}
        open={isOrderTopicsModalOpen}
      />
    </React.Fragment>
  );
};

export const AdminSection = AdminSectionComponent;
