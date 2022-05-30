/* @jsx m */

import m from 'mithril';
import { Popover } from 'construct-ui';

import 'components/reaction_button/comment_reaction_button.scss';

import app from 'state';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { OffchainComment, ChainInfo } from 'models';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';

type CommentReactionButtonAttrs = {
  comment: OffchainComment<any>;
};

export class CommentReactionButton
  implements m.ClassComponent<CommentReactionButtonAttrs>
{
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode: m.VnodeDOM<CommentReactionButtonAttrs, this>) {
    const { comment } = vnode.attrs;
    const reactionCounts = app.reactionCounts.store.getByPost(comment);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    const isAdmin =
      app.user.isSiteAdmin ||
      app.user.isAdminOfEntity({ chain: app.activeChainId() });

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
          m.redraw();
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
          m.redraw();
        });
    };

    const reactionButtonComponent = (
      <div
        onmouseenter={async () => {
          this.reactors = await fetchReactionsByPost(comment);
        }}
        onclick={async (e) =>
          onReactionClick(e, hasReacted, dislike, like, comment)
        }
        class={`CommentReactionButton${this.loading ? ' disabled' : ''}${
          hasReacted ? ' has-reacted' : ''
        }`}
      >
        <CWIcon iconName={hasReacted ? 'heartFilled' : 'heartEmpty'} />
        <div class="reactions-count">{likes}</div>
      </div>
    );

    return likes > 0 ? (
      <Popover
        interactionType="hover"
        content={
          <div class="reaction-button-tooltip-contents">
            {getDisplayedReactorsForPopup({
              likes,
              reactors: this.reactors,
            })}
          </div>
        }
        trigger={reactionButtonComponent}
        hoverOpenDelay={100}
      />
    ) : (
      reactionButtonComponent
    );
  }
}
