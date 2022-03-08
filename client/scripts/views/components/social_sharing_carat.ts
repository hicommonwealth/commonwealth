import m from 'mithril';
import { MenuItem, Icons, PopoverMenu, Icon } from 'construct-ui';
import { int } from 'aws-sdk/clients/datapipeline';

export const SocialSharingCarat: m.Component<{
  commentID?: int;
}> = {
  view: (vnode) => {
    return m(PopoverMenu, {
      transitionDuration: 0,
      closeOnOutsideClick: true,
      closeOnContentClick: true,
      menuAttrs: { size: 'default' },
      content: [
        m(MenuItem, {
          iconLeft: Icons.COPY,
          label: 'Copy URL',
          onclick: async (e) => {
            if (!vnode.attrs.commentID) {
              await navigator.clipboard.writeText(
                `https://commonwealth.im${m.route.get()}`
              );
            } else {
              await navigator.clipboard.writeText(
                `https://commonwealth.im${m.route.get()}?comment=${
                  vnode.attrs.commentID
                }`
              );
            }
          },
        }),
        m(MenuItem, {
          iconLeft: Icons.TWITTER,
          label: 'Share on Twitter',
          onclick: async (e) => {
            if (!vnode.attrs.commentID) {
              await window.open(
                `https://twitter.com/intent/tweet?text=https://commonwealth.im${m.route.get()}`,
                '_blank'
              );
            } else {
              await window.open(
                `https://twitter.com/intent/tweet?text=https://commonwealth.im${m.route.get()}?comment=${
                  vnode.attrs.commentID
                }`,
                '_blank'
              );
            }
          },
        }),
      ],
      inline: true,
      trigger: m(Icon, { name: Icons.SHARE_2 }),
    });
  },
};
