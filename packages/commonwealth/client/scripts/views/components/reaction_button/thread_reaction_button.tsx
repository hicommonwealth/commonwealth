/* @jsx m */

import ClassComponent from 'class_component';

import 'components/reaction_button/comment_reaction_button.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import m from 'mithril';
import { Thread, ChainInfo, Reaction } from 'models';

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

type ThreadReactionButtonAttrs = {
  thread: Thread;
};

export class ThreadReactionButton extends ClassComponent<ThreadReactionButtonAttrs> {
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode: m.Vnode<ThreadReactionButtonAttrs>) {
    const { thread } = vnode.attrs;
    const reactionCounts = app.reactionCounts.store.getByPost(thread);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    let topicName = '';

    if (thread instanceof Thread && thread.topic && app.topics) {
      topicName = thread.topic.name;
    }

    this.loading =
      this.loading || (!isAdmin && TopicGateCheck.isGatedTopic(topicName));

    const activeAddress = app.user.activeAccount?.address;

    const dislike = async (userAddress: string) => {
      const reaction: Reaction = (
        await fetchReactionsByPost(thread)
      ).find((r) => {
        return r.Address.address === activeAddress;
      });

      const { session, action, hash } =
        await app.sessions.signDeleteThreadReaction({
          thread_id: reaction.canvasHash,
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
      const { session, action, hash } = await app.sessions.signThreadReaction({
        thread_id: thread.id,
        like: true,
      });

      this.loading = true;
      app.reactionCounts
        .create(userAddress, thread, 'like', chainId)
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
          this.reactors = await fetchReactionsByPost(thread);
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
