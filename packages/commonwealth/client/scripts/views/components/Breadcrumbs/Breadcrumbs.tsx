import 'components/Breadcrumbs/Breadcrumbs.scss';
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { breadCrumbURLS } from './data';
import clsx from 'clsx';
import app from 'state';

export const Breadcrumbs = () => {
  const location = useLocation();

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

  function generateBreadcrumbs(locationPath: string, breadCrumbData: any[]) {
    const pathSegments = locationPath
      .split('/')
      .filter((segment) => segment.length > 0);

    const breadcrumbs = pathSegments.map((pathSegment, index) => {
      let link: string;
      const matchedBreadcrumb = breadCrumbData.find(
        (breadcrumbItem) =>
          breadcrumbItem.url === pathSegments.slice(0, index + 1).join('/')
      );

      if (pathSegment === 'profile') {
        link = `/profile/id/${profileId}`;
      } else {
        link = pathSegments.slice(0, index + 1).join('/');
      }

      const splitLinks = link.split('/').filter((val) => val.length > 0);

      return {
        text: matchedBreadcrumb
          ? matchedBreadcrumb.breadcrumb
          : decodeURIComponent(pathSegment),
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

    if (location.pathname.includes(String(profileId))) {
      return 'viewProfile';
    }

    if (location.pathname.includes('createCommunity')) {
      return 'createCommunity';
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
              <Link className="active standalone" to={'/'}>
                {pathnames[0].text}
              </Link>
            </CWText>
          </li>
        ) : (
          pathnames.map((path, index) => {
            return path.isParent ? (
              <CWTooltip
                hasBackground
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
                      <Link to={'/' + path.link}>{path.text}</Link>
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
                    {path.text}
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
