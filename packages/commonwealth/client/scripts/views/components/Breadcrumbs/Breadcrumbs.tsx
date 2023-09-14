import 'components/Breadcrumbs/Breadcrumbs.scss';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { CWText } from '../component_kit/cw_text';
import app from 'state';

type BreadcrumbsProps = {
  standalone?: boolean;
};

export const Breadcrumbs = ({ standalone }: BreadcrumbsProps) => {
  const location = useLocation();

  const user = app.user.addresses[0];
  const profileId = user?.profileId || user?.profile.id;

  const standalonePaths = [
    'explore',
    'dashboard',
    'notifications',
    'notification-settings',
    'createCommunity',
  ];

  if (
    standalonePaths.includes(location.pathname.split('/')[1]) ||
    location.pathname.includes(String(profileId))
  ) {
    standalone = true;
  }

  const pathnames = location.pathname
    .split('/')
    .map((x, index, arr) => {
      let link: string;

      if (x === 'profile') {
        link = `/profile/id/${profileId}`;
      } else {
        link = arr.slice(0, index + 1).join('/');
      }

      console.log('x', x, location.pathname);

      return { text: x, link: link ? link : location.pathname };
    })
    .filter((x) => x.text.length > 0);

  console.log('path', pathnames);

  const getStyle = (page) => {
    let path: string;
    path = page[0].link.split('/')[0];

    if (location.pathname.includes('discussions')) {
      path = 'discussions';
    }

    if (
      location.pathname.includes('members') ||
      location.pathname.includes('notifications')
    ) {
      path = 'members';
    }

    console.log(page);

    if (location.pathname.includes(String(profileId))) {
      path = 'viewProfile';
    }

    return {
      notifications: 'notifications',
      discussions: 'discussions',
      members: 'members',
      viewProfile: 'viewProfile',
    }[path];
  };

  return (
    <nav className="Breadcrumbs">
      <div className={`${getStyle(pathnames) ?? 'commonPadding'}`}>
        {standalone ? (
          <li>
            <CWText type="b2" fontWeight="regular">
              <a>{pathnames[0].text}</a>
            </CWText>
          </li>
        ) : (
          pathnames.map((path, index) => (
            <li key={`${location.key} - ${index}`}>
              <CWText type="b2" fontWeight="regular">
                <a href={path.link}>{path.text}</a>
              </CWText>
            </li>
          ))
        )}
      </div>
    </nav>
  );
};
