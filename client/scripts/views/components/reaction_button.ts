import 'components/reaction_button.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Popover } from 'construct-ui';

import app, { LoginState } from 'state';
import { IUniqueId, Proposal, OffchainComment, OffchainThread, AnyProposal, AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import Token from 'controllers/chain/ethereum/token/adapter';
import BN from 'bn.js';

import SelectAddressModal from '../modals/select_address_modal';
import LoginModal from '../modals/login_modal';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

export enum ReactionType {
  Like = 'like',
  Dislike = 'dislike'
}

const ReactionButton: m.Component<{
  post: OffchainThread | AnyProposal | OffchainComment<any>;
  type: ReactionType;
  displayAsLink?: boolean;
  tooltip?: boolean;
  large?: boolean;
}, { loading: boolean }> = {
  view: (vnode) => {
    const { post, type, displayAsLink, tooltip, large } = vnode.attrs;
    const reactions = app.reactions.getByPost(post);

    let dislikes;
    let likes;
    if (type === ReactionType.Like) likes = reactions.filter((r) => r.reaction === 'like');
    if (type === ReactionType.Dislike) dislikes = reactions.filter((r) => r.reaction === 'dislike');

    const isCommunity = !!app.activeCommunityId();

    const tokenBalance = app.chain && (app.chain as Token).tokenBalance;
    const isAdmin = app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });

    let tokenPostingThreshold;
    if( post instanceof OffchainThread && post.topic && app.topics) {
      tokenPostingThreshold = app.topics.getByName((post as OffchainThread).topic.name, app.activeId()).token_threshold
    } else if (post instanceof OffchainComment) {
      // post.rootProposal has typescript typedef number but in practice seems to be a string
      const parentThread = app.threads.getById(parseInt(post.rootProposal.toString().split('_')[1], 10));
      tokenPostingThreshold = app.topics.getByName((parentThread).topic.name, app.activeId()).token_threshold
    } else {
      tokenPostingThreshold = new BN(0);
    }
    const disabled = vnode.state.loading
      || (
        (!isCommunity && (app.chain as Token).isToken)
        && !isAdmin
        && (tokenBalance == null || (tokenPostingThreshold && tokenPostingThreshold.gt(tokenBalance)))
      );
    const activeAddress = app.user.activeAccount?.address;
    const rxn = reactions.find((r) => r.reaction && r.author === activeAddress);
    const hasReacted : boolean = !!rxn;
    let hasReactedType;
    if (hasReacted) hasReactedType = rxn.reaction;

    const reactors = (likes || dislikes).slice(0, MAX_VISIBLE_REACTING_ACCOUNTS).map((rxn_) => {
      return m('.reacting-user', m(User, {
        user: new AddressInfo(null, rxn_.author, rxn_.author_chain, null),
        linkify: true
      }));
    });
    if (reactors.length < (likes || dislikes).length) {
      const diff = (likes || dislikes).length - reactors.length;
      reactors.push(m('.reacting-user .truncated-reacting-users', `and ${diff} more`));
    }
    const tooltipPopover = m('.reaction-button-tooltip', reactors);

    const rxnButton = m('.ReactionButton', {
      class: `${(disabled ? 'disabled' : type === hasReactedType ? 'active' : '')
        + (displayAsLink ? ' as-link' : '')
        + (large ? ' large' : '')
        + (type === ReactionType.Like ? ' like' : '')
        + (type === ReactionType.Dislike ? ' dislike' : '')}`,
      onclick: (e) => {
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
          // if it's a community use the app.user.activeAccount.chain.id instead of author chain
          const chainId = app.activeCommunityId() ? null : app.activeChainId();
          const communityId = app.activeCommunityId();
          if (hasReacted) {
            const reaction = reactions.find((r) => r.reaction === hasReactedType && r.author === activeAddress);
            vnode.state.loading = true;
            app.reactions.delete(reaction).then(() => {
              if ((hasReactedType === ReactionType.Like && type === ReactionType.Dislike)
                || (hasReactedType === ReactionType.Dislike && type === ReactionType.Like)) {
                app.reactions.create(app.user.activeAccount.address, post, type, chainId, communityId).then(() => {
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
            app.reactions.create(app.user.activeAccount.address, post, type, chainId, communityId)
              .then(() => {
                vnode.state.loading = false;
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
      m('.upvote-icon', large ? '▾' : '👎'),
      m('.upvote-count', dislikes.length),
    ], (type === ReactionType.Like) && [
      m('.reactions-icon', large ? '▾' : '👍'),
      m('.reactions-count', likes.length),
    ]);

    return (tooltip && reactors.length)
      ? m(Popover, {
        class: 'ReactionButtonTooltip',
        interactionType: 'hover',
        content: tooltipPopover,
        trigger: rxnButton,
        hoverOpenDelay: 100
      })
      : rxnButton;
  }
};

export default ReactionButton;
