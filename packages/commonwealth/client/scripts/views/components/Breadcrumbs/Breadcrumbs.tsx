import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import { CWBreadcrumbs } from '../component_kit/cw_breadcrumbs';
import './Breadcrumbs.scss';
import { breadCrumbURLS } from './data';
import { generateBreadcrumbs } from './utils';

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();

  const getThreadId = location.pathname.match(/\/(\d+)-/);

  const { data: linkedThreads } = useGetThreadsByIdQuery({
    chainId: app.activeChainId(),
    ids: [getThreadId && Number(getThreadId[1])],
    apiCallEnabled:
      // Only call when in discussion pages prevents unnecessary calls.
      location.pathname.split('/')[1].toLowerCase() === 'discussion',
  });

  const user = app?.user?.addresses?.[0];
  const profileId = user?.profileId || user?.profile.id;

  const currentDiscussion = {
    currentThreadName: linkedThreads?.[0]?.title,
    currentTopic: linkedThreads?.[0]?.topic.name,
    topicURL: `/discussions/${encodeURI(linkedThreads?.[0]?.topic.name)}`,
  };

  let standalone = false;

  /**
   * An array of paths that are considered standalone pages.
   */
  const standalonePaths = [
    'explore',
    'dashboard',
    'notifications',
    'notification-settings',
    'createCommunity',
  ];

  //Checks if the current page is a standalone page or if it contains the /profile/id.
  if (
    standalonePaths.includes(location.pathname.split('/')[1]) ||
    location.pathname.includes('/profile/id')
  ) {
    standalone = true;
  }

  const pathnames = generateBreadcrumbs(
    location.pathname,
    profileId,
    navigate,
    app.isCustomDomain() ? app.activeChainId() : undefined,
    currentDiscussion,
  );

  //Determines the style based on the current page.
  const getStyle = () => {
    const findStyle = breadCrumbURLS.find((page) => {
      if (!page.className) return;
      if (location.pathname.split('/').length > 1) {
        return location.pathname.includes(page.url);
      }
      return location.pathname === page.url;
    });

    if (findStyle) {
      return findStyle.className;
    }

    if (
      location.pathname.includes(String(profileId)) ||
      location.pathname.includes('/profile/id')
    ) {
      return 'viewProfile';
    }
  };

  //Gets the tooltip copy based on the current page.
  const getToolTipCopy = () => {
    const lastPathSegment = location.pathname.split('/').pop();

    const tooltips = {
      admin: 'This is a section, not a selectable page.',
      discussionsGovernance: 'This is an app, not a selectable page.',
    };

    const isAdminOrGovernance = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment &&
        (breadcrumbItem.isAdmin || breadcrumbItem.isGovernance),
    );

    return isAdminOrGovernance
      ? tooltips[
          isAdminOrGovernance.isAdmin ? 'admin' : 'discussionsGovernance'
        ]
      : undefined;
  };

  return (
    <nav className="Breadcrumbs">
      <div className={`${getStyle() ?? 'commonPadding'}`}>
        {standalone ? (
          <CWBreadcrumbs breadcrumbs={[pathnames[0]]} />
        ) : (
          <CWBreadcrumbs
            breadcrumbs={pathnames}
            tooltipStr={
              getToolTipCopy() || 'This is an app, not a selectable page.'
            }
          />
        )}
      </div>
    </nav>
  );
};
