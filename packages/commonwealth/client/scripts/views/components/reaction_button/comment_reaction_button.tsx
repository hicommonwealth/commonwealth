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

import 'components/reaction_button/comment_reaction_button.scss';

import app from 'state';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { Comment, ChainInfo } from 'models';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { getClasses } from '../component_kit/helpers';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';

type CommentReactionButtonAttrs = {
  comment: Comment<any>;
};

export class CommentReactionButton extends ClassComponent<CommentReactionButtonAttrs> {
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode: ResultNode<CommentReactionButtonAttrs>) {
    const { comment } = vnode.attrs;
    const reactionCounts = app.reactionCounts.store.getByPost(comment);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    // post.rootProposal has typescript typedef number but in practice seems to be a string
    const parentThread = app.threads.getById(
      parseInt(comment.rootProposal.toString().split('_')[1], 10)
    );

    const topicName = parentThread?.topic?.name;

    this.loading =
      this.loading || (!isAdmin && TopicGateCheck.isGatedTopic(topicName));

    const activeAddress = app.user.activeAccount?.address;

    const dislike = async (userAddress: string) => {
      const reaction = (await fetchReactionsByPost(comment)).find((r) => {
        return r.Address.address === activeAddress;
      });
      this.loading = true;
      app.reactionCounts
        .delete(reaction, {
          ...reactionCounts,
          likes: likes - 1,
          hasReacted: false,
        })
        .then(() => {
          this.reactors = this.reactors.filter(
            ({ Address }) => Address.address !== userAddress
          );
          this.loading = false;
          redraw();
        });
    };

    const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
      this.loading = true;
      app.reactionCounts
        .create(userAddress, comment, 'like', chainId)
        .then(() => {
          this.loading = false;
          this.reactors = [
            ...this.reactors,
            {
              Address: { address: userAddress, chain },
            },
          ];
          redraw();
        });
    };

    const countsComponent = (
      <CWText className="menu-buttons-text" type="caption" fontWeight="medium">
        {likes}
      </CWText>
    );

    return (
      <div
        className={getClasses<{ disabled?: boolean }>(
          { disabled: this.loading },
          'CommentReactionButton'
        )}
        onMouseEnter={async () => {
          this.reactors = await fetchReactionsByPost(comment);
        }}
      >
        <CWIconButton
          iconName="upvote"
          iconSize="small"
          selected={hasReacted}
          onClick={async (e) => onReactionClick(e, hasReacted, dislike, like)}
        />
        {likes > 0 ? (
          <CWTooltip
            content={
              <div className="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
                  likes,
                  reactors: this.reactors,
                })}
              </div>
            }
            trigger={countsComponent}
            tooltipType="bordered"
          />
        ) : (
          countsComponent
        )}
        {/* <CWIconButton iconName="downvote" iconSize="small" disabled /> */}
      </div>
    );
  }
}
