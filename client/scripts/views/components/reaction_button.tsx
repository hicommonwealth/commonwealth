/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Icon, Icons, Popover, Size } from 'construct-ui';
import BN from 'bn.js';
import $ from 'jquery';

import 'components/reaction_button.scss';

import app from 'state';
import {
  Proposal,
  OffchainComment,
  OffchainThread,
  AnyProposal,
  AddressInfo,
  ITokenAdapter,
} from 'models';
import User from 'views/components/widgets/user';
import ReactionCount from 'models/ReactionCount';
import SelectAddressModal from '../modals/select_address_modal';
import LoginModal from '../modals/login_modal';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

export enum ReactionType {
  Like = 'like',
  Dislike = 'dislike',
}

type ReactionButtonState = {
  dislikes: number;
  hasReacted: boolean;
  likes: number;
  loading: boolean;
  reactionCounts: ReactionCount<any>;
  reactors: any;
};

type ReactionButtonAttrs = {
  displayAsLink?: boolean;
  large?: boolean;
  post: OffchainThread | AnyProposal | OffchainComment<any>;
  tooltip?: boolean;
  type: ReactionType;
};

const getDisplayedReactorsForPopup = (
  vnode: m.Vnode<ReactionButtonAttrs & ReactionButtonState>
) => {
  const { reactors = [], likes = 0, dislikes = 0 } = vnode.attrs;

  const slicedReactors = reactors
    .slice(0, MAX_VISIBLE_REACTING_ACCOUNTS)
    .map((rxn_) => {
      const {
        Address: { address, chain },
      } = rxn_;
      return m(User, {
        user: new AddressInfo(null, address, chain, null),
        linkify: true,
      });
    });

  if (reactors && slicedReactors.length < likes + dislikes) {
    const diff = likes + dislikes - slicedReactors.length;

    slicedReactors.push(
      m('.reacting-user .truncated-reacting-users', `and ${diff} more`)
    );
  }

  return slicedReactors;
};

const fetchReactionsByPost = async (
  post: OffchainThread | AnyProposal | OffchainComment<any>
) => {
  let thread_id, proposal_id, comment_id;

  if (post instanceof OffchainThread) {
    thread_id = (post as OffchainThread).id;
  } else if (post instanceof Proposal) {
    proposal_id = `${(post as AnyProposal).slug}_${
      (post as AnyProposal).identifier
    }`;
  } else if (post instanceof OffchainComment) {
    comment_id = (post as OffchainComment<any>).id;
  }

  const { result = [] } = await $.get(`${app.serverUrl()}/bulkReactions`, {
    thread_id,
    comment_id,
    proposal_id,
  });

  return result;
};

export class ReactionButton implements m.ClassComponent<ReactionButtonAttrs> {
  private dislikes: number;
  private hasReacted: boolean;
  private likes: number;
  private loading: boolean;
  private reactionCounts: ReactionCount<any>;
  private reactors: any;

  view(vnode) {
    const { post, type, displayAsLink, tooltip, large } = vnode.attrs;

    this.reactionCounts = app.reactionCounts.getByPost(post);

    const { likes = 0, dislikes = 0, hasReacted } = this.reactionCounts || {};

    this.likes = likes;

    this.dislikes = dislikes;

    let disabled = this.loading;

    // token balance check if needed
    if (ITokenAdapter.instanceOf(app.chain)) {
      const tokenBalance = app.chain.tokenBalance;

      const isAdmin =
        app.user.isSiteAdmin ||
        app.user.isAdminOfEntity({ chain: app.activeChainId() });

      let tokenPostingThreshold: BN;

      if (post instanceof OffchainThread && post.topic && app.topics) {
        tokenPostingThreshold = app.topics.getByName(
          (post as OffchainThread).topic.name,
          app.activeChainId()
        )?.tokenThreshold;
      } else if (post instanceof OffchainComment) {
        // post.rootProposal has typescript typedef number but in practice seems to be a string
        const parentThread = app.threads.getById(
          parseInt(post.rootProposal.toString().split('_')[1], 10)
        );
        tokenPostingThreshold = app.topics.getByName(
          parentThread.topic.name,
          app.activeChainId()
        )?.tokenThreshold;
      } else {
        tokenPostingThreshold = new BN(0);
      }

      disabled =
        this.loading ||
        (!isAdmin &&
          tokenPostingThreshold &&
          tokenPostingThreshold.gt(tokenBalance));
    }

    const activeAddress = app.user.activeAccount?.address;

    this.hasReacted = hasReacted;

    let hasReactedType;

    if (hasReacted) hasReactedType = ReactionType.Like;

    const rxnButton = (
      <div
        class="ProposalBodyReaction"
        onmouseenter={async () => {
          this.reactors = await fetchReactionsByPost(post);
        }}
        onclick={async (e) => {
          const { reactors, reactionCounts } = this;
          e.preventDefault();
          e.stopPropagation();
          if (disabled) return;
          if (!app.isLoggedIn()) {
            app.modals.create({
              modal: LoginModal,
            });
          } else if (!app.user.activeAccount) {
            app.modals.create({
              modal: SelectAddressModal,
            });
          } else {
            const { address: userAddress, chain } = app.user.activeAccount;
            // if it's a community use the app.user.activeAccount.chain.id instead of author chain
            const chainId = app.activeChainId();
            if (hasReacted) {
              const reaction = (await fetchReactionsByPost(post)).find((r) => {
                return (
                  r.reaction === hasReactedType &&
                  r.Address.address === activeAddress
                );
              });
              this.loading = true;
              app.reactionCounts
                .delete(reaction, {
                  ...reactionCounts,
                  likes: likes - 1,
                  hasReacted: false,
                })
                .then(() => {
                  this.reactors = reactors.filter(
                    ({ Address }) => Address.address !== userAddress
                  );
                  if (
                    (hasReactedType === ReactionType.Like &&
                      type === ReactionType.Dislike) ||
                    (hasReactedType === ReactionType.Dislike &&
                      type === ReactionType.Like)
                  ) {
                    app.reactions
                      .create(userAddress, post, type, chainId)
                      .then(() => {
                        this.loading = false;
                        m.redraw();
                      });
                  } else {
                    this.loading = false;
                    m.redraw();
                  }
                });
            } else {
              this.loading = true;
              app.reactionCounts
                .create(userAddress, post, type, chainId)
                .then(() => {
                  this.loading = false;
                  this.reactors = [
                    ...reactors,
                    {
                      Address: { address: userAddress, chain },
                    },
                  ];
                  m.redraw();
                });
            }
            mixpanel.track('Create Reaction ', {
              'Step No': 1,
              Step: 'Create Reaction',
              'Post Name': `${post.slug}: ${post.identifier}`,
              Scope: app.activeChainId(),
            });
            mixpanel.people.increment('Reaction');
            mixpanel.people.set({
              'Last Reaction Created': new Date().toISOString(),
            });
          }
        }}
      >
        <div
          class={`ReactionButton ${
            (disabled ? 'disabled' : type === hasReactedType ? 'active' : '') +
            (displayAsLink ? ' as-link' : '') +
            (large ? ' large' : '') +
            (type === ReactionType.Like ? ' like' : '') +
            (type === ReactionType.Dislike ? ' dislike' : '')
          }`}
        >
          {type === ReactionType.Dislike && large ? (
            <div class="reactions-icon">▾</div>
          ) : (
            <div>
              <Icon
                class="reactions-icon"
                name={Icons.THUMBS_DOWN}
                size={Size.XL}
              />
              <div class="upvote-count">{this.dislikes}</div>
            </div>
          )}
          {type === ReactionType.Like && large ? (
            <div class="reactions-icon">▾</div>
          ) : (
            <div>
              <Icon
                class="reactions-icon"
                name={Icons.THUMBS_UP}
                size={Size.XL}
              />
              <div class="reactions-count">{this.likes}</div>
            </div>
          )}
        </div>
      </div>
    );

    return tooltip && (this.likes || this.dislikes) ? (
      <Popover
        class="ReactionButtonTooltip"
        interactionType="hover"
        content={
          <div class="reaction-button-tooltip">
            {getDisplayedReactorsForPopup(vnode)}
          </div>
        }
        trigger={rxnButton}
        hoverOpenDelay={100}
      />
    ) : (
      rxnButton
    );
  }
}
