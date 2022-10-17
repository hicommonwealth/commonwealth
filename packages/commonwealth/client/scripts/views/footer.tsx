/* @jsx m */

import m from 'mithril';

import 'footer.scss';

import { isNotUndefined } from '../helpers/typeGuards';

const footercontents = [
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

export class Footer implements m.ClassComponent {
  view() {
    const redirectClick = (route) => {
      m.route.set(route);
    };

    return (
      <div class="Footer">
        <img src="/static/brand_assets/512x512.svg" alt="Commonwealth" />
        <div class="footer-links-container">
          {footercontents.map((item) => {
            return isNotUndefined(item.redirectTo) ? (
              <a
                class="footer-link"
                onclick={(e) => {
                  e.preventDefault();
                  redirectClick(item.redirectTo);
                }}
              >
                {item.text}
              </a>
            ) : (
              <a class="footer-link" href={item.externalLink} target="_blank">
                {item.text}
              </a>
            );
          })}
        </div>
      </div>
    );
  }
}
