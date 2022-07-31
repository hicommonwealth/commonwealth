/* @jsx m */

import m from 'mithril';

import 'footer.scss';

import { isNotUndefined } from '../helpers/typeGuards';

type FooterAttrs = {
  list: { text: string; redirectTo?: string; externalLink?: string }[];
};

export class Footer implements m.ClassComponent<FooterAttrs> {
  view(vnode) {
    const { list } = vnode.attrs;

    const redirectClick = (route) => {
      m.route.set(route);
    };

    return (
      <div class="Footer">
        <img src="/static/img/logo.svg" alt="Commonwealth" />
        <div class="footer-links-container">
          {list.map((item) => {
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
