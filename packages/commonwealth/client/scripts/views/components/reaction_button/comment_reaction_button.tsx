/* @jsx m */

import ClassComponent from 'class_component';

import 'components/reaction_button/comment_reaction_button.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import m from 'mithril';
import type { ChainInfo, Comment } from 'models';

import app from 'state';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { CWText } from '../component_kit/cw_text';
import { getClasses } from '../component_kit/helpers';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';

type CommentReactionButtonAttrs = {
  comment: Comment<any>;
};

export class CommentReactionButton extends ClassComponent<CommentReactionButtonAttrs> {
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode: m.Vnode<CommentReactionButtonAttrs>) {
    const { comment } = vnode.attrs;
    const reactionCounts = app.reactionCounts.store.getByPost(comment);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    const parentThread = app.threads.getById(comment.threadId);

    const topicName = parentThread?.topic?.name;

    this.loading =
      this.loading || (!isAdmin && TopicGateCheck.isGatedTopic(topicName));

    const activeAddress = app.user.activeAccount?.address;

    const dislike = async (userAddress: string) => {
      const reaction = (await fetchReactionsByPost(comment)).find((r) => {
        return r.Address.address === activeAddress;
      });

      await app.sessions.signDeleteCommentReaction({
        comment_id: reaction.canvasId,
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
          m.redraw();
        });
    };

    const like = async (
      chain: ChainInfo,
      chainId: string,
      userAddress: string
    ) => {
      await app.sessions.signCommentReaction({
        comment_id: comment.id,
        like: true,
      });

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
          m.redraw();
        });
    };

    const countsComponent = (
      <CWText className="menu-buttons-text" type="caption" fontWeight="medium">
        {likes}
      </CWText>
    );

    return (
      <div
        class={getClasses<{ disabled?: boolean }>(
          { disabled: this.loading },
          'CommentReactionButton'
        )}
        onmouseenter={async () => {
          this.reactors = await fetchReactionsByPost(comment);
        }}
      >
        <CWIconButton
          iconName="upvote"
          iconSize="small"
          selected={hasReacted}
          onclick={async (e) => onReactionClick(e, hasReacted, dislike, like)}
        />
        {likes > 0 ? (
          <CWTooltip
            interactionType="hover"
            tooltipContent={
              <div class="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
                  likes,
                  reactors: this.reactors,
                })}
              </div>
            }
            trigger={countsComponent}
            hoverOpenDelay={100}
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
