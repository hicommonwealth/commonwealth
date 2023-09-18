import 'components/Breadcrumbs/Breadcrumbs.scss';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
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
  /**
   * Parses the current location pathname into an array of breadcrumb items.
   *
   * @param {Object} location - The location object containing pathname information.
   * @returns {Array} An array of breadcrumb items, each with a text, link, and isParent property.
   */
  const pathnames = location.pathname
    .split('/')
    .map((x, index, arr) => {
      let link: string;
      let isParentBreadcrumb = false;

      if (x === 'profile') {
        link = `/profile/id/${profileId}`;
      } else {
        link = arr.slice(0, index + 1).join('/');
      }

      const splitLinks = link.split('/').filter((val) => val.length > 0);

      if (splitLinks.length === 1) {
        isParentBreadcrumb = true;
      }

      return {
        text: x,
        link: link ? link : location.pathname,
        isParent: isParentBreadcrumb,
      };
    })
    .filter((x) => x.text.length > 0);

  /**
   * Determines the style based on the current page.
   *
   * @param page - An array of objects representing the page links.
   * @returns The style associated with the current page.
   */
  const getStyle = (page: Array<{ link: string }>) => {
    let path: string;
    path = page[0].link.split('/')[0];

    const governancePaths = ['members', 'snapshot', 'proposals'];

    if (location.pathname.includes('discussions')) {
      path = 'discussions';
    }

    if (governancePaths.some((x) => location.pathname.includes(x))) {
      path = 'governance';
    }

    if (location.pathname.includes(String(profileId))) {
      path = 'viewProfile';
    }

    return {
      notifications: 'notifications',
      discussions: 'discussions',
      governance: 'governance',
      viewProfile: 'viewProfile',
    }[path];
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
      <div className={`${getStyle(pathnames) ?? 'commonPadding'}`}>
        {standalone ? (
          <li>
            <CWText type="b2" fontWeight="regular">
              <a className="active">{pathnames[0].text}</a>
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
                      <a>{path.text}</a>
                    </CWText>
                  </li>
                )}
              />
            ) : (
              <li key={`${location.key} - ${index}`}>
                <CWText type="b2" fontWeight="regular">
                  <a
                    className={pathnames.length - 1 === index ? 'active' : ''}
                    href={path.link}
                  >
                    {path.text}
                  </a>
                </CWText>
              </li>
            );
          })
        )}
      </div>
    </nav>
  );
};
