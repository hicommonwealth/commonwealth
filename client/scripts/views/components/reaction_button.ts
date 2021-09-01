import 'components/reaction_button.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Icon, Icons, Popover, Size } from 'construct-ui';

import app from 'state';
import { Proposal, OffchainComment, OffchainThread, AnyProposal, AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import Token from 'controllers/chain/ethereum/token/adapter';
import BN from 'bn.js';

import $ from 'jquery';
import ReactionCount from 'models/ReactionCount';
import SelectAddressModal from '../modals/select_address_modal';
import LoginModal from '../modals/login_modal';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

export enum ReactionType {
  Like = 'like',
  Dislike = 'dislike'
}

type ReactionButtonState = {
  loading: boolean
  reactors: any
  reactionCounts: ReactionCount<any>
  likes: number
  dislikes: number
  hasReacted: boolean
}

type ReactionButtonAttrs = {
  post: OffchainThread | AnyProposal | OffchainComment<any>;
  type: ReactionType;
  displayAsLink?: boolean;
  tooltip?: boolean;
  large?: boolean;
}

const getDisplayedReactorsForPopup = (vnode: m.Vnode<ReactionButtonAttrs, ReactionButtonState>) => {
  const { reactors = [], likes = 0, dislikes = 0 } = vnode.state;
  const slicedReactors = reactors.slice(0, MAX_VISIBLE_REACTING_ACCOUNTS).map((rxn_) => {
    const { Address: { address, chain } } = rxn_;
    return m('.reacting-user', m(User, {
      user: new AddressInfo(null, address, chain, null),
      linkify: true
    }));
  });

  if (vnode.state.reactors && slicedReactors.length < (likes + dislikes)) {
    const diff = (likes + dislikes) - slicedReactors.length;
    slicedReactors.push(m('.reacting-user .truncated-reacting-users', `and ${diff} more`));
  }
  return slicedReactors;
};

const fetchReactionsByPost = async (post: OffchainThread | AnyProposal | OffchainComment<any>) => {
  let thread_id, proposal_id, comment_id;
  if (post instanceof OffchainThread) {
    thread_id = (post as OffchainThread).id;
  } else if (post instanceof Proposal) {
    proposal_id = `${(post as AnyProposal).slug}_${(post as AnyProposal).identifier}`;
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

const ReactionButton: m.Component<ReactionButtonAttrs, ReactionButtonState> = {
  view: (vnode) => {
    const { post, type, displayAsLink, tooltip, large } = vnode.attrs;
    const reactionCounts = app.reactionCounts.getByPost(post);
    const { likes = 0, dislikes = 0, hasReacted } = reactionCounts || {};
    vnode.state.reactionCounts = reactionCounts;
    vnode.state.likes = likes;
    vnode.state.dislikes = dislikes;

    const isCommunity = !!app.activeCommunityId();

    const tokenBalance = app.chain && (app.chain as Token).tokenBalance;
    const isAdmin = app.user.isSiteAdmin
      || app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });

    let tokenPostingThreshold;
    if( post instanceof OffchainThread && post.topic && app.topics) {
      tokenPostingThreshold = (app.chain as Token) ? app.topics.getByName((post as OffchainThread).topic.name, app.activeId()).tokenThreshold : null;
    } else if (post instanceof OffchainComment) {
      // post.rootProposal has typescript typedef number but in practice seems to be a string
      const parentThread = app.threads.getById(parseInt(post.rootProposal.toString().split('_')[1], 10));
      tokenPostingThreshold = app.topics.getByName((parentThread).topic.name, app.activeId()).tokenThreshold
    } else {
      tokenPostingThreshold = new BN(0);
    }
    const disabled = vnode.state.loading
      || (
        (!isCommunity && (app.chain as Token)?.isToken)
        && !isAdmin
        && (tokenBalance == null || (tokenPostingThreshold && tokenPostingThreshold.gt(tokenBalance)))
      );
    const activeAddress = app.user.activeAccount?.address;
    vnode.state.hasReacted = hasReacted;
    let hasReactedType;
    if (hasReacted) hasReactedType = ReactionType.Like;

    const rxnButton = m('.ReactionButton', {
      class: `${(disabled ? 'disabled' : type === hasReactedType ? 'active' : '')
        + (displayAsLink ? ' as-link' : '')
        + (large ? ' large' : '')
        + (type === ReactionType.Like ? ' like' : '')
        + (type === ReactionType.Dislike ? ' dislike' : '')}`,
      onmouseenter:  async (e) => {
        vnode.state.reactors = await fetchReactionsByPost(post);
      },
      onclick: async (e) => {
        const { reactors, reactionCounts } = vnode.state;
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (!app.isLoggedIn()) {
          app.modals.create({
            modal: LoginModal
          });
        } else if (!app.user.activeAccount) {
          app.modals.create({
            modal: SelectAddressModal,
          });
        } else {
          const { address: userAddress, chain } = app.user.activeAccount;
          // if it's a community use the app.user.activeAccount.chain.id instead of author chain
          const chainId = app.activeCommunityId() ? null : app.activeChainId();
          const communityId = app.activeCommunityId();
          if (hasReacted) {
            const reaction = (await fetchReactionsByPost(post)).find((r) => {
              return (r.reaction === hasReactedType && r.Address.address === activeAddress);
            });
            vnode.state.loading = true;
            app.reactionCounts.delete(reaction, {
              ...reactionCounts,
              likes: likes - 1,
              hasReacted: false
            }).then(() => {
              vnode.state.reactors = reactors.filter(({ Address }) => Address.address !== userAddress);
              if ((hasReactedType === ReactionType.Like && type === ReactionType.Dislike)
                || (hasReactedType === ReactionType.Dislike && type === ReactionType.Like)) {
                app.reactions.create(userAddress, post, type, chainId, communityId).then(() => {
                  vnode.state.loading = false;
                  m.redraw();
                });
              } else {
                vnode.state.loading = false;
                m.redraw();
              }
            });
          } else {
            vnode.state.loading = true;
            app.reactionCounts.create(userAddress, post, type, chainId, communityId)
              .then(() => {
                vnode.state.loading = false;
                vnode.state.reactors = [ ...reactors, {
                  Address: { address: userAddress, chain }
                }];
                m.redraw();
              });
          }
          mixpanel.track('Create Reaction ', {
            'Step No': 1,
            'Step': 'Create Reaction',
            'Post Name': `${post.slug}: ${post.identifier}`,
            'Scope': app.activeId(),
          });
          mixpanel.people.increment('Reaction');
          mixpanel.people.set({
            'Last Reaction Created': new Date().toISOString()
          });
        }
      },
    }, (type === ReactionType.Dislike) && [
      large
        ? m('.reactions-icon', '▾')
        : m(Icon, {
          class: 'reactions-icon',
          name: Icons.THUMBS_DOWN,
          size: Size.XL,
        }),
      m('.upvote-count', vnode.state.dislikes),
    ], (type === ReactionType.Like) && [
      large
        ? m('.reactions-icon', '▾')
        : m(Icon, {
          class: 'reactions-icon',
          name: Icons.THUMBS_UP,
          size: Size.XL,
        }),
      m('.reactions-count', vnode.state.likes),
    ]);

    return (tooltip && (vnode.state.likes || vnode.state.dislikes))
      ? m(Popover, {
        class: 'ReactionButtonTooltip',
        interactionType: 'hover',
        content: m('.reaction-button-tooltip', getDisplayedReactorsForPopup(vnode)),
        trigger: rxnButton,
        hoverOpenDelay: 100
      })
      : rxnButton;
  }
};

export default ReactionButton;
