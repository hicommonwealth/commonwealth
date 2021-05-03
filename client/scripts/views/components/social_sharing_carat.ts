import m from 'mithril';
import { MenuItem, Icons } from 'construct-ui';

export const SocialSharingCarat: m.Component<{
  }> = {
    view: (vnode) => {
      return [m(MenuItem, {
        iconLeft: Icons.COPY,
        label: 'Copy URL',
        onclick: async (e) => {
          await navigator.clipboard.writeText(`https://commonwealth.im${  m.route.get()}`);
        },
      }), m(MenuItem, {
        iconLeft: Icons.TWITTER,
        label: 'Share on Twitter',
        onclick: async (e) => {
          await window.open(`https://twitter.com/intent/tweet?text=https://commonwealth.im${  m.route.get()}`, '_blank');
        }
      }), m(MenuItem, {
        iconLeft: Icons.MESSAGE_CIRCLE,
        label: 'Share on Telegram',
        onclick: async (e) => {
          await navigator.clipboard.writeText(`https://commonwealth.im${  m.route.get()}`);
        }
      })];
    }
  };
