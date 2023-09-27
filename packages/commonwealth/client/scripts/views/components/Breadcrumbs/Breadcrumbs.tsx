import './Breadcrumbs.scss';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useCommonNavigate } from 'navigation/helpers';
import { CWBreadcrumbs } from '../component_kit/cw_breadcrumbs';
import { breadCrumbURLS } from './data';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import app from 'state';

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();

  function extractNumberFromUrl(url) {
    const match = url.match(/(\d+)/); // Match one or more digits
    if (match) {
      return [match[0]];
    }
  }

  const { data: threads } = useGetThreadsByIdQuery({
    chainId: app.activeChainId(),
    ids: extractNumberFromUrl(location.pathname),
  });

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

  let standalone = false;

  /**
   * An array of paths that are considered standalone pages.
   */
  const standalonePaths: Array<string> = [
    'explore',
    'dashboard',
    'notifications',
    'notification-settings',
    'createCommunity',
  ];

  /**
   * Checks if the current page is a standalone page or if it contains the profileId.
   *
   * @param {string} pathname - The pathname of the current location.
   * @param {string} profileId - The profile ID to check for.
   * @returns {boolean} True if the page is standalone or contains the profileId, otherwise false.
   */
  if (
    standalonePaths.includes(location.pathname.split('/')[1]) ||
    location.pathname.includes(String(profileId))
  ) {
    standalone = true;
  }

  /**
   * Generates breadcrumbs based on the given location path and breadcrumb data.
   *
   * @param {string} locationPath - The current location path.
   * @param {any[]} breadcrumbData - An array of breadcrumb data objects.
   * @returns {Array<{ text: string, link: string, isParent: boolean }>} An array of breadcrumb objects.
   */

  function generateBreadcrumbs(
    locationPath: string,
    breadcrumbData: typeof breadCrumbURLS
  ) {
    let threadName: string | undefined;
    let link: string;
    const pathSegments = locationPath
      .split('/')
      .filter((segment) => segment.length > 0);

    const breadcrumbs = pathSegments.map((pathSegment, index) => {
      // Find the matching breadcrumb data for the current path segment.
      const matchedBreadcrumb = breadcrumbData.find((breadcrumbItem) => {
        // Check if breadcrumbItem.url is falsy or if index is out of bounds
        if (!breadcrumbItem.url || index >= pathSegments.length) {
          return false;
        }
        return (
          breadcrumbItem.url === pathSegments.slice(0, index + 1).join('/')
        );
      });

      // Generate the link based on the current path segment.
      if (pathSegment === 'profile') {
        link = `id/${profileId}`;
      } else if (pathSegment === 'new') {
        // Remove 'new' segment and generate the link.
        console.log('FIRED1');
        pathSegments.splice(index, 1);

        console.log('PATH:', pathSegments);
        link = `new/discussion`;
      } else if (pathSegments[index] === 'discussion') {
        // Generate the link for 'discussion' segment.
        link = `discussions`;
      } else {
        console.log('FIRED2');
        // Generate a default link for other segments.
        link = pathSegments.slice(0, index + 1).join('/');
      }

      const splitLinks = link.split('/').filter((val) => val.length > 0);

      // Determine the thread name if it's the last segment and conditions are met.
      if (
        index === pathSegments.length - 1 &&
        extractNumberFromUrl(location.pathname) &&
        threads &&
        !location.pathname.includes('%')
      ) {
        threadName = threads?.find(
          (thread: { id: number }) =>
            thread.id === Number(extractNumberFromUrl(location.pathname))
        ).title;
      }

      // Create the breadcrumb object.
      return {
        label:
          index === pathSegments.length - 1 && !!threadName
            ? threadName
            : matchedBreadcrumb
            ? matchedBreadcrumb.breadcrumb
            : decodeURIComponent(pathSegments[index]),
        path: link ? `/${link}` : locationPath,
        navigate: (val: string) => navigate(val),
        isParent: pathSegments[0] === splitLinks[index],
      };
    });

    return breadcrumbs.filter((val) => val !== undefined);
  }

  const pathnames = generateBreadcrumbs(location.pathname, breadCrumbURLS);

  /**
   * Determines the style based on the current page.
   *
   * @param page - An array of objects representing the page links.
   * @returns The style associated with the current page.
   */
  const getStyle = () => {
    const findStyle = breadCrumbURLS.find((page) => {
      if (!page.className) return;
      if (location.pathname.split('/').length > 2) {
        return location.pathname.includes(page.url);
      }
      return location.pathname === page.url;
    });

    if (findStyle) {
      return findStyle.className;
    }

    if (location.pathname.includes(String(profileId))) {
      return 'viewProfile';
    }
  };

  /**
   * Gets the tooltip copy based on the current page.
   *
   * @returns The tooltip copy for the current page, or `undefined` if it's not found which is handled in the return.
   */

  const getToolTipCopy = () => {
    const pathSegments = location.pathname.split('/');
    const lastPathSegment = pathSegments[pathSegments.length - 1];

    const tooltips = {
      admin: 'This is a section, not a selectable page.',
      discussionsGovernance: 'This is an app, not a selectable page.',
    };

    const isAdmin = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment && breadcrumbItem.isAdmin
    );

    const isGovernance = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment && breadcrumbItem.isGovernance
    );

    if (isAdmin) {
      return tooltips.admin;
    } else if (isGovernance) {
      return tooltips.discussionsGovernance;
    }
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
