/* @jsx m */

import m from 'mithril';
import { int } from 'aws-sdk/clients/datapipeline';

import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';

export class SocialSharingCarat
  implements m.ClassComponent<{ commentId?: int }>
{
  view(vnode) {
    const domain = document.location.origin;

    return (
      <CWPopoverMenu
        menuItems={[
          {
            iconLeft: 'copy',
            label: 'Copy URL',
            onclick: async () => {
              const currentRouteSansCommentParam = m.route
                .get()
                .split('?comment=')[0];
              if (!vnode.attrs.commentId) {
                await navigator.clipboard.writeText(
                  `${domain}${currentRouteSansCommentParam}`
                );
              } else {
                await navigator.clipboard.writeText(
                  `${domain}${currentRouteSansCommentParam}?comment=${vnode.attrs.commentId}`
                );
              }
            },
          },
          {
            iconLeft: 'twitter',
            label: 'Share on Twitter',
            onclick: async () => {
              if (!vnode.attrs.commentId) {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}`,
                  '_blank'
                );
              } else {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}?comment=${
                    vnode.attrs.commentId
                  }`,
                  '_blank'
                );
              }
            },
          },
        ]}
        trigger={<CWIconButton iconName="share2" iconSize="small" />}
      />
    );
  }
}
