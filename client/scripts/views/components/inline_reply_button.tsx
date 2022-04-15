/* @jsx m */

import m from 'mithril';

import 'components/inline_reply_button.scss';

import { CWIcon } from './component_kit/cw_icons/cw_icon';

export class InlineReplyButton
  implements m.ClassComponent<{ commentReplyCount: number; onclick }>
{
  view(vnode) {
    const { commentReplyCount, onclick } = vnode.attrs;
    return (
      <div
        class={`InlineReplyButton${
          commentReplyCount > 0 ? ' has-reacted' : ''
        }`}
        onclick={onclick}
      >
        <CWIcon iconName="feedback" />
        <div class="reply-count">{commentReplyCount}</div>
      </div>
    );
  }
}
