import m from 'mithril';
import { MenuItem, Icons } from 'construct-ui';
import { int } from 'aws-sdk/clients/datapipeline';

export const SocialSharingCarat: m.Component<{
    commentID?: int,
  }> = {
    view: (vnode) => {
      return [m(MenuItem, {
        iconLeft: Icons.COPY,
        label: 'Copy URL',
        onclick: async (e) => {
          if (vnode.attrs.commentID == null) {
            await navigator.clipboard.writeText(`https://commonwealth.im${  m.route.get()}`);
          } else {
            await navigator.clipboard.writeText(`https://commonwealth.im${  m.route.get()}?comment=${vnode.attrs.commentID}`);
          }
        },
      }), m(MenuItem, {
        iconLeft: Icons.TWITTER,
        label: 'Share on Twitter',
        onclick: async (e) => {
          if (vnode.attrs.commentID == null) {
            await window.open(`https://twitter.com/intent/tweet?text=https://commonwealth.im${  m.route.get()}`, '_blank');
          } else {
            await window.open(`https://twitter.com/intent/tweet?text=https://commonwealth.im${  m.route.get()}?comment=${vnode.attrs.commentID}`, '_blank');
          }
        }
      })];
    }
  };
