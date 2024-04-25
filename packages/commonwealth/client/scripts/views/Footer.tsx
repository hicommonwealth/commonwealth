import 'Footer.scss';
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
      <img src="/static/brand_assets/512x512.svg" alt="Commonwealth" />
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
            >
              {item.text}
            </a>
          );
        })}

        {/*Mava Widget*/}
        <script
          defer
          src="https://widget.mava.app"
          // eslint-disable-next-line react/no-unknown-property
          widget-version="v2"
          id="MavaWebChat"
          // eslint-disable-next-line react/no-unknown-property
          enable-sdk="false"
          data-token="28672714d1690a96717516beafd198d5dcacf85b19fde51e88b05ed8831640c9"
        ></script>
      </div>
    </div>
  );
};
