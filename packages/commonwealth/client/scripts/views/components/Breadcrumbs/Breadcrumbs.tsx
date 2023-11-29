import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { CWBreadcrumbs } from '../component_kit/cw_breadcrumbs';
import './Breadcrumbs.scss';
import { breadCrumbURLS } from './data';
import { generateBreadcrumbs } from './utils';

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

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

  //Checks if the current page is a standalone page or if it contains the profileId.
  if (
    standalonePaths.includes(location.pathname.split('/')[1]) ||
    location.pathname.includes(String(profileId))
  ) {
    standalone = true;
  }

  const pathnames = generateBreadcrumbs(
    location.pathname,
    breadCrumbURLS,
    profileId,
    navigate,
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
    const pathSegments = location.pathname.split('/');
    const lastPathSegment = pathSegments[pathSegments.length - 1];

    const tooltips = {
      admin: 'This is a section, not a selectable page.',
      discussionsGovernance: 'This is an app, not a selectable page.',
    };

    const isAdmin = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment && breadcrumbItem.isAdmin,
    );

    const isGovernance = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment && breadcrumbItem.isGovernance,
    );

    if (isAdmin) {
      return tooltips.admin;
    } else if (isGovernance) {
      return tooltips.discussionsGovernance;
    }
  };

  console.log('path', pathnames);

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
