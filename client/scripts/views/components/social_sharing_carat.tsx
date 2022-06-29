/* @jsx m */

import m from 'mithril';
import { MenuItem, Icons, PopoverMenu } from 'construct-ui';
import { int } from 'aws-sdk/clients/datapipeline';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type SocialSharingCaratAttrs = { commentID?: int };

export class SocialSharingCarat
  implements m.ClassComponent<SocialSharingCaratAttrs>
{
  view(vnode) {
    const domain = document.location.origin;
    return (
      <PopoverMenu
        transitionDuration={0}
        closeOnOutsideClick={true}
        closeOnContentClick={true}
        menuAttrs={{ size: 'default' }}
        content={[
          <MenuItem
            iconLeft={Icons.COPY}
            label="Copy URL"
            onclick={async () => {
              if (!vnode.attrs.commentID) {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}`
                );
              } else {
                await navigator.clipboard.writeText(
                  `${domain}${m.route.get()}?comment=${
                    vnode.attrs.commentID
                  }`
                );
              }
            }}
          />,
          <MenuItem
            iconLeft={Icons.TWITTER}
            label="Share on Twitter"
            onclick={async () => {
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
            }}
          />,
        ]}
        trigger={<CWIcon iconName="share2" iconSize="small" />}
      />
    );
  }
}
