/* @jsx m */

import ClassComponent from 'class_component';

import 'components/reaction_button/thread_preview_reaction_button.scss';
import { Popover } from 'construct-ui';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import m from 'mithril';
import type { ChainInfo, Thread } from 'models';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { fetchReactionsByPost, getDisplayedReactorsForPopup, onReactionClick, } from './helpers';

type ThreadPreviewReactionButtonAttrs = {
  thread: Thread;
};

export class ThreadPreviewReactionButton extends ClassComponent<ThreadPreviewReactionButtonAttrs> {
  private loading: boolean;

  oninit() {
    this.loading = false;
  }

  view(vnode: m.Vnode<ThreadPreviewReactionButtonAttrs>) {
    const { thread } = vnode.attrs;

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

    const hasReacted = activeAddress ?
      thread.associatedReactions.filter(r => r.address === activeAddress).length > 0
      : false;

    const dislike = async (userAddress: string) => {
      const reaction = (await fetchReactionsByPost(thread)).find((r) => {
        return r.Address.address === activeAddress;
      });

      const { session, action, hash } =
        await app.sessions.signDeleteThreadReaction({
          thread_id: reaction.canvasId,
        });

      this.loading = true;
      app.threadReactions
        .deleteOnThread(userAddress, thread)
        .then(() => {
          this.loading = false;
          thread.associatedReactions = thread.associatedReactions.filter(r => r.address !== activeAddress);
          m.redraw();
        });
    };

    const like = async (
      chain: ChainInfo,
      chainId: string,
      userAddress: string
    ) => {
      await app.sessions.signThreadReaction({
        thread_id: thread.id,
        like: true,
      });

      this.loading = true;
      app.threadReactions
        .createOnThread(userAddress, thread, 'like')
        .then((reaction) => {
          this.loading = false;
          thread.associatedReactions.push({id: reaction.id, type: reaction.reaction, address: activeAddress});
          m.redraw();
        });
    };

    const reactionButtonComponent = (
      <div
        onclick={async (e) => onReactionClick(e, hasReacted, dislike, like)}
        class={`ThreadPreviewReactionButton${this.loading ? ' disabled' : ''}${
          hasReacted ? ' has-reacted' : ''
        }`}
      >
        <CWIcon
          iconName={hasReacted ? 'heartFilled' : 'heartEmpty'}
          iconSize="small"
        />
        <div class="reactions-count">{thread.associatedReactions.length}</div>
      </div>
    );

    return thread.associatedReactions.length > 0
      ? m(Popover, {
        interactionType: 'hover',
        content: (
          <div class="reaction-button-tooltip-contents">
            {getDisplayedReactorsForPopup({
              likes: thread.associatedReactions.length,
              reactors: app.threadReactions.getByThreadId(thread.id),
            })}
          </div>
        ),
        trigger: reactionButtonComponent,
        hoverOpenDelay: 100,
      })
      : reactionButtonComponent;
  }
}
