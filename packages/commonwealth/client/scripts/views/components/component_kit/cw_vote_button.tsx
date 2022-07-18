/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_vote_button.scss';

import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';

type VoteType = 'upvote' | 'downvote';

type VoteButtonAttrs = {
  onclick: () => void;
  voteCount: number;
  voteType: VoteType;
};

export class CWVoteButton implements m.ClassComponent<VoteButtonAttrs> {
  view(vnode) {
    const { onclick, voteCount, voteType } = vnode.attrs;

    return (
      <div class={ComponentType.VoteButton} onclick={onclick}>
        <CWIcon iconName="upvote" iconSize="small" />
        <CWText type="caption" fontWeight="medium">
          {voteCount}
        </CWText>
        <CWIcon iconName="downvote" iconSize="small" />
      </div>
    );
  }
}
