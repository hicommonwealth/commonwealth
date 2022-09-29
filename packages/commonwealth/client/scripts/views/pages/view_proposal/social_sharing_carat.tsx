/* @jsx m */

import m from 'mithril';
import { int } from 'aws-sdk/clients/datapipeline';

import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';

export class SocialSharingCarat
  implements m.ClassComponent<{ commentID?: int }>
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
              if (!vnode.attrs.commentID) {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}`
                );
              } else {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}?comment=${vnode.attrs.commentID}`
                );
              }
            },
          },
          {
            iconName: 'twitter',
            label: 'Share on Twitter',
            onclick: async () => {
              if (!vnode.attrs.commentID) {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}`,
                  '_blank'
                );
              } else {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}?comment=${
                    vnode.attrs.commentID
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
