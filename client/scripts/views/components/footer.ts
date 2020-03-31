import 'components/footer.scss';

import { default as m } from 'mithril';
import { default as moment } from 'moment-twitter';
import { symbols, link } from 'helpers';
import app from 'state';
import FeedbackModal from 'views/modals/feedback_modal';

const Footer: m.Component<{}> = {
  view: (vnode: m.VnodeDOM<{}>) => {
    return m('.Footer', [
      m('.container', [
        m('.footer-text', [
          symbols.copy,
          ' ',
          moment().format('YYYY'),
          ' Commonwealth',
        ]),
        link('a.footer-link', '/privacy', 'Privacy'),
        link('a.footer-link', '/terms', 'Terms'),
        // link('a.footer-link', '/about', 'About'),
        m('a.footer-link.footer-link-right', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: FeedbackModal
            });
          }
        }, 'Feedback'),
        m('.clear'),
      ])
    ]);
  }
};

export default Footer;
