/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Popover } from 'construct-ui';
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
  ChainInfo,
} from 'models';
import User from 'views/components/widgets/user';
import ReactionCount from 'models/ReactionCount';
import SelectAddressModal from '../modals/select_address_modal';
import LoginModal from '../modals/login_modal';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

type ReactorAttrs = {
  likes: number;
  reactors: any;
};

type Post = OffchainThread | AnyProposal | OffchainComment<any>;

type ReactionButtonAttrs = {
  post: Post;
};

const getDisplayedReactorsForPopup = (reactorAttrs: ReactorAttrs) => {
  const { reactors = [], likes = 0 } = reactorAttrs;

  const slicedReactors = reactors
    .slice(0, MAX_VISIBLE_REACTING_ACCOUNTS)
    .map((rxn) => {
      const {
        Address: { address, chain },
      } = rxn;

      return m(User, {
        user: new AddressInfo(null, address, chain, null),
        linkify: true,
      });
    });

  if (slicedReactors.length < likes) {
    const diff = likes - slicedReactors.length;

    slicedReactors.push(<div>{`and ${diff} more`}</div>);
  }

  return slicedReactors;
};

const fetchReactionsByPost = async (post: Post) => {
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

const onReactionClick = (
  e: MouseEvent,
  hasReacted: boolean,
  dislike: (userAddress: string) => void,
  like: (chain: ChainInfo, chainId: string, userAddress: string) => void,
  post: Post
) => {
  e.preventDefault();
  e.stopPropagation();

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
      dislike(userAddress);
    } else {
      like(chain, chainId, userAddress);
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
};

const gettokenPostingThreshold = (post: Post) => {
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

  return tokenPostingThreshold;
};

export class ReactionButton implements m.ClassComponent<ReactionButtonAttrs> {
  private loading: boolean;
  private reactors: any;

  oninit() {
    this.loading = false;
  }

  view(vnode) {
    const { post } = vnode.attrs;
    const reactionCounts = app.reactionCounts.getByPost(post);
    const { likes = 0, hasReacted } = reactionCounts || {};

    // token balance check if needed
    if (ITokenAdapter.instanceOf(app.chain)) {
      const tokenBalance = app.chain.tokenBalance;

      const isAdmin =
        app.user.isSiteAdmin ||
        app.user.isAdminOfEntity({ chain: app.activeChainId() });

      const tokenPostingThreshold = gettokenPostingThreshold(post);

      this.loading =
        !isAdmin &&
        tokenPostingThreshold &&
        tokenPostingThreshold.gt(tokenBalance);
    }

    const activeAddress = app.user.activeAccount?.address;

    const dislike = async (userAddress: string) => {
      const reaction = (await fetchReactionsByPost(post)).find((r) => {
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
      app.reactionCounts.create(userAddress, post, 'like', chainId).then(() => {
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

    const reactionButton = (
      <div
        onmouseenter={async () => {
          this.reactors = await fetchReactionsByPost(post);
        }}
        onclick={async (e) =>
          onReactionClick(e, hasReacted, dislike, like, post)
        }
        class={`ReactionButton${this.loading ? ' disabled' : ''}${
          hasReacted ? ' hasReacted' : ''
        }`}
      >
        <CWIcon iconName="arrow1" iconSize="small" />
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
        trigger={reactionButton}
        hoverOpenDelay={100}
      />
    ) : (
      reactionButton
    );
  }
}
