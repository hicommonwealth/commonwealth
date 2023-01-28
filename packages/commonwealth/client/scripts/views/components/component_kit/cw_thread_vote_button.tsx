/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_thread_vote_button.scss';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type ThreadVoteButtonAttrs = {
  updateVoteCount: (newCount: number) => void;
  voteCount: number;
};

export class CWThreadVoteButton extends ClassComponent<ThreadVoteButtonAttrs> {
  private isHoveringUpvote: boolean;
  private isHoveringDownvote: boolean;
  private initialVoteCount: number;

  oncreate(vnode: ResultNode<ThreadVoteButtonAttrs>) {
    this.initialVoteCount = vnode.attrs.voteCount;
  }

  view(vnode: ResultNode<ThreadVoteButtonAttrs>) {
    const { updateVoteCount, voteCount } = vnode.attrs;

    const handleVoteChange = (newCount: number) => {
      updateVoteCount(newCount);
    };

    return (
      <div
        className={getClasses<{
          isHoveringUpvote: boolean;
          isHoveringDownvote: boolean;
          hasUpvoted: boolean;
          hasDownvoted: boolean;
        }>(
          {
            isHoveringUpvote: this.isHoveringUpvote,
            isHoveringDownvote: this.isHoveringDownvote,
            hasUpvoted: voteCount === this.initialVoteCount + 1,
            hasDownvoted: voteCount === this.initialVoteCount - 1,
          },
          ComponentType.ThreadVoteButton
        )}
      >
        <CWIcon
          iconName="upvote"
          iconSize="small"
          onClick={() => {
            voteCount === this.initialVoteCount + 1
              ? handleVoteChange(this.initialVoteCount)
              : handleVoteChange(voteCount + 1);
          }}
          className="upvote-button"
          onMouseEnter={() => {
            this.isHoveringUpvote = true;
          }}
          onMouseLeave={() => {
            this.isHoveringUpvote = false;
          }}
        />
        <CWText
          type="caption"
          fontWeight="medium"
          className="vote-count"
          title={voteCount}
        >
          {formatNumberShort(voteCount)}
        </CWText>
        <CWIcon
          iconName="downvote"
          iconSize="small"
          onClick={() => {
            voteCount === this.initialVoteCount - 1
              ? handleVoteChange(this.initialVoteCount)
              : handleVoteChange(voteCount - 1);
          }}
          onMouseEnter={() => {
            this.isHoveringDownvote = true;
          }}
          onMouseLeave={() => {
            this.isHoveringDownvote = false;
          }}
          className="downvote-button"
        />
      </div>
    );
  }
}
