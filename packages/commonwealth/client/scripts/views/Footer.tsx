import 'Footer.scss';
import brandAssetUrl from 'assets/brand_assets/512x512.svg';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Link } from 'react-router-dom';
import { isNotUndefined } from '../helpers/typeGuards';

const footercontents = [
  { text: 'About', redirectTo: '/whyCommonwealth' },
  { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
  {
    text: 'Jobs',
    externalLink: 'https://boards.greenhouse.io/commonwealth',
  },
  { text: 'Terms', redirectTo: '/terms' },
  { text: 'Privacy', redirectTo: '/privacy' },
  { text: 'Docs', externalLink: 'https://docs.commonwealth.im' },
  {
    text: 'Discord',
    externalLink: 'https://discord.gg/t9XscHdZrG',
  },
  {
    text: 'Telegram',
    externalLink: 'https://t.me/HiCommonwealth',
  },
];

export const Footer = () => {
  const navigate = useCommonNavigate();

  const redirectClick = (route) => {
    navigate(route, {}, null);
  };

  return (
    <div className="Footer">
      <img src={brandAssetUrl} alt="Commonwealth" />
      <div className="footer-links-container">
        {footercontents.map((item) => {
          return isNotUndefined(item.redirectTo) ? (
            <Link
              className="footer-link"
              onClick={(e) => {
                e.stopPropagation();
              }}
              key={item.text}
              to={item.redirectTo}
            >
              {item.text}
            </Link>
          ) : (
            <a
              className="footer-link"
              key={item.text}
              href={item.externalLink}
              target="_blank"
              rel="noreferrer"
            >
              {item.text}
            </a>
          );
        })}
      </div>
    </div>
  );
};
