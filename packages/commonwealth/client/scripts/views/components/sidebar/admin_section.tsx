import { handleRedirectClicks } from 'helpers';

import { _DEPRECATED_getRoute } from 'mithrilInterop';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { EditTopicThresholdsModal } from '../../modals/edit_topic_thresholds_modal';
import { NewTopicModal } from '../../modals/new_topic_modal';
import { OrderTopicsModal } from '../../modals/order_topics_modal';
import { Modal } from '../component_kit/cw_modal';
import { verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree, } from './types';

const setAdminToggleTree = (path: string, toggle: boolean) => {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`]
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

  const [isEditTopicThresholdsModalOpen, setIsEditTopicThresholdsModalOpen] =
    React.useState<boolean>(false);
  const [isOrderTopicsModalOpen, setIsOrderTopicsModalOpen] =
    React.useState<boolean>(false);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] =
    React.useState<boolean>(false);

  const adminGroupData: SectionGroupAttrs[] = [
    {
      title: 'Manage community',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: _DEPRECATED_getRoute().includes('/manage'),
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(
          navigate,
          e,
          `/manage`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          }
        );
      },
    },
    {
      title: 'Analytics',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: _DEPRECATED_getRoute().includes('/analytics'),
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(
          navigate,
          e,
          `/analytics`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.analytics.toggledState`, toggle);
          }
        );
      },
    },
    {
      title: 'Contracts',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: _DEPRECATED_getRoute().includes('/contracts'),
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();

        handleRedirectClicks(
          navigate,
          e,
          `/contracts`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.contracts.toggledState`, toggle);
          }
        );
      },
    },
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
        setIsOrderTopicsModalOpen(true);
      },
    },
    {
      title: 'Edit topic thresholds',
      isActive: isEditTopicThresholdsModalOpen,
      isVisible: true,
      containsChildren: false,
      displayData: null,
      isUpdated: false,
      hasDefaultToggle: false,
      onClick: (e) => {
        e.preventDefault();
        setIsEditTopicThresholdsModalOpen(true);
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
      adminDefaultToggleTree
    );
  } else if (!verifyCachedToggleTree('admin', adminDefaultToggleTree)) {
    localStorage[`${app.activeChainId()}-admin-toggle-tree`] = JSON.stringify(
      adminDefaultToggleTree
    );
  }

  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`]
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
      <Modal
        content={
          <NewTopicModal onModalClose={() => setIsNewTopicModalOpen(false)} />
        }
        onClose={() => setIsNewTopicModalOpen(false)}
        open={isNewTopicModalOpen}
      />
      <Modal
        content={
          <OrderTopicsModal
            onModalClose={() => setIsOrderTopicsModalOpen(false)}
          />
        }
        onClose={() => setIsOrderTopicsModalOpen(false)}
        open={isOrderTopicsModalOpen}
      />
      <Modal
        content={
          <EditTopicThresholdsModal
            onModalClose={() => setIsEditTopicThresholdsModalOpen(false)}
          />
        }
        onClose={() => setIsEditTopicThresholdsModalOpen(false)}
        open={isEditTopicThresholdsModalOpen}
      />
    </React.Fragment>
  );
};

export const AdminSection = AdminSectionComponent;
