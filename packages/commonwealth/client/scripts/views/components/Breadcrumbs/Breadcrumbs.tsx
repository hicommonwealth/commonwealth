import './Breadcrumbs.scss';
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { breadCrumbURLS } from './data';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import clsx from 'clsx';
import app from 'state';

export const Breadcrumbs = () => {
  const location = useLocation();

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
      const matchedBreadcrumb = breadcrumbData.find(
        (breadcrumbItem) =>
          breadcrumbItem.url === pathSegments.slice(0, index + 1).join('/')
      );

      // Generate the link based on the current path segment.
      if (pathSegment === 'profile') {
        link = `profile/id/${profileId}`;
      } else if (pathSegment === 'new') {
        // Remove 'new' segment and generate the link.
        pathSegments.splice(index, 1);
        link = `${pathSegments[index - 1]}/new/discussion`;
      } else if (pathSegments[index] === 'discussion') {
        // Generate the link for 'discussion' segment.
        link = `${pathSegments[index - 1]}/discussions`;
      } else {
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
        text:
          index === pathSegments.length - 1 && !!threadName
            ? threadName
            : matchedBreadcrumb
            ? matchedBreadcrumb.breadcrumb
            : decodeURIComponent(pathSegments[index]),
        link: link ? link : locationPath,
        isParent: splitLinks.length === 1,
      };
    });

    return breadcrumbs;
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
      return location.pathname === page.url;
    });

    if (findStyle) {
      return findStyle.className;
    }
    const governancePaths = ['members', 'snapshot', 'proposals'];

    if (location.pathname.includes('discussions')) {
      return 'discussions';
    }

    if (
      governancePaths.some((governancePath) =>
        location.pathname.includes(governancePath)
      )
    ) {
      return 'governance';
    }

    if (location.pathname.includes('new/discussion')) {
      return 'new-thread';
    }

    if (location.pathname.includes(String(profileId))) {
      return 'viewProfile';
    }

    if (location.pathname.includes('createCommunity')) {
      return 'createCommunity';
    }

    if (location.pathname.includes('notification-settings')) {
      return 'notification-management';
    }

    if (location.pathname.includes('notifications')) {
      return 'notifications';
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

    if (lastPathSegment in tooltips) {
      return tooltips[lastPathSegment];
    }

    return;
  };

  return (
    <nav className="Breadcrumbs">
      <div className={`${getStyle() ?? 'commonPadding'}`}>
        {standalone ? (
          <li>
            <CWText type="b2" fontWeight="regular">
              <Link className="active standalone" to={null}>
                {pathnames[0].text}
              </Link>
            </CWText>
          </li>
        ) : (
          pathnames.map((path, index) => {
            const pathText =
              path.text === 'object' ? path.text.toString() : path.text;
            return path.isParent ? (
              <CWTooltip
                content={
                  getToolTipCopy() ||
                  'This is a section, not a selectable page.'
                }
                placement="bottom"
                renderTrigger={(handleIneraction) => (
                  <li
                    key={`${location.key} - ${index}`}
                    onMouseEnter={handleIneraction}
                    onMouseLeave={handleIneraction}
                  >
                    <CWText type="b2" fontWeight="regular">
                      <Link
                        className={clsx({
                          'disable-active-cursor': index === 0,
                        })}
                        to={index !== 0 ? '/' + path.link : null}
                      >
                        {pathText}
                      </Link>
                    </CWText>
                  </li>
                )}
              />
            ) : (
              <li key={`${location.key} - ${index}`}>
                <CWText type="b2" fontWeight="regular">
                  <Link
                    className={clsx({
                      active: pathnames.length - 1 === index,
                    })}
                    to={'/' + path.link}
                  >
                    {pathText}
                  </Link>
                </CWText>
              </li>
            );
          })
        )}
      </div>
    </nav>
  );
};
