import React from 'react';

import { ClassComponent } from 'mithrilInterop';

import 'footer.scss';
import m from 'mithril';

import { isNotUndefined } from '../helpers/typeGuards';
import withRouter from 'navigation/helpers';

const footercontents = [
  { text: 'About', redirectTo: '/whyCommonwealth' },
  { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
  {
    text: 'Jobs',
    externalLink: 'https://angel.co/company/commonwealth-labs/jobs',
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

class FooterComponent extends ClassComponent {
  view() {
    const redirectClick = (route) => {
      this.setRoute(route);
    };

    return (
      <div className="Footer">
        <img src="/static/brand_assets/512x512.svg" alt="Commonwealth" />
        <div className="footer-links-container">
          {footercontents.map((item) => {
            return isNotUndefined(item.redirectTo) ? (
              <a
                className="footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  redirectClick(item.redirectTo);
                }}
                key={item.text}
              >
                {item.text}
              </a>
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
        </div>
      </div>
    );
  }
}

export const Footer = withRouter(FooterComponent);
