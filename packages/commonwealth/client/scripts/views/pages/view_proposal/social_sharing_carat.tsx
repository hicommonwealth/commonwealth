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
        popoverMenuItems={[
          {
            iconName: 'copy',
            label: 'Copy URL',
            onclick: async () => {
              if (!vnode.attrs.commentId) {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}`
                );
              } else {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}?comment=${vnode.attrs.commentId}`
                );
              }
            },
          },
          {
            iconName: 'twitter',
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
