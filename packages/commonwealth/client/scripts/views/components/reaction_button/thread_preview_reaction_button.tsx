/* @jsx m */

import ClassComponent from 'class_component';

import 'components/reaction_button/thread_preview_reaction_button.scss';
import { Popover } from 'construct-ui';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import m from 'mithril';
import type { ChainInfo, Thread } from 'models';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';

type ThreadPreviewReactionButtonAttrs = {
  thread: Thread;
};

export class ThreadPreviewReactionButton extends ClassComponent<ThreadPreviewReactionButtonAttrs> {
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode: m.Vnode<ThreadPreviewReactionButtonAttrs>) {
    const { thread } = vnode.attrs;
    const reactionCounts = app.reactionCounts.store.getByPost(thread);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    let topicName = '';

    if (thread.topic && app.topics) {
      topicName = thread.topic.name;
    }

    this.loading =
      this.loading || (!isAdmin && TopicGateCheck.isGatedTopic(topicName));

    const activeAddress = app.user.activeAccount?.address;

    const dislike = async (userAddress: string) => {
      const reaction = (await fetchReactionsByPost(thread)).find((r) => {
        return r.Address.address === activeAddress;
      });

      const { session, action, hash } =
        await app.sessions.signDeleteThreadReaction({
          thread_id: reaction.canvasId,
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

    const reactionButtonComponent = (
      <div
        onmouseenter={async () => {
          this.reactors = await fetchReactionsByPost(thread);
        }}
        onclick={async (e) => onReactionClick(e, hasReacted, dislike, like)}
        class={`ThreadPreviewReactionButton${this.loading ? ' disabled' : ''}${
          hasReacted ? ' has-reacted' : ''
        }`}
      >
        <CWIcon
          iconName={hasReacted ? 'heartFilled' : 'heartEmpty'}
          iconSize="small"
        />
        <div class="reactions-count">{likes}</div>
      </div>
    );

    return likes > 0
      ? m(Popover, {
          interactionType: 'hover',
          content: (
            <div class="reaction-button-tooltip-contents">
              {getDisplayedReactorsForPopup({
                likes,
                reactors: this.reactors,
              })}
            </div>
          ),
          trigger: reactionButtonComponent,
          hoverOpenDelay: 100,
        })
      : reactionButtonComponent;
  }
}
