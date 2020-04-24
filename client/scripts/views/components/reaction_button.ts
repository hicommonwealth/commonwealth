import 'components/reaction_button.scss';

import { default as m, VnodeDOM } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';

import app from 'state';
import { IUniqueId, Proposal, OffchainComment, OffchainThread, AnyProposal } from 'models';
import Tooltip from 'views/components/tooltip';
import User from 'views/components/widgets/user';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

export enum ReactionType {
  Like = 'like',
  Dislike = 'dislike'
}

interface IAttrs {
  post: OffchainThread | OffchainComment<any>;
  type: ReactionType;
  displayAsLink?: boolean;
  tooltip?: boolean;
}

interface IState {
  loading: boolean;
}

const ReactionButton: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const { post, type, displayAsLink, tooltip } = vnode.attrs;
    const reactions = app.reactions.getByPost(post);
    let dislikes;
    let likes;
    if (type === ReactionType.Like) likes = reactions.filter((r) => r.reaction === 'like');
    if (type === ReactionType.Dislike) dislikes = reactions.filter((r) => r.reaction === 'dislike');

    const disabled = !app.vm.activeAccount || vnode.state.loading;
    const activeAddress = app.vm.activeAccount?.address;
    const rxn = reactions.find((r) => r.reaction && r.author === activeAddress);
    const hasReacted : boolean = !!rxn;
    let hasReactedType;
    if (hasReacted) hasReactedType = rxn.reaction;

    const reactors = (likes || dislikes).slice(0, MAX_VISIBLE_REACTING_ACCOUNTS).map((rxn_) => {
      return m('.reacting-user', m(User, { user: [rxn_.author, rxn_.author_chain], linkify: true }));
    });
    if (reactors.length < (likes || dislikes).length) {
      const diff = (likes || dislikes).length - reactors.length;
      reactors.push(m('.reacting-user .truncated-reacting-users', `and ${diff} more`));
    }
    const tooltipPopover = m('.ReactionButtonTooltip', reactors);

    const rxnButton = m('.ReactionButton', {
      class: `${(disabled ? 'disabled' : type === hasReactedType ? 'active' : '')
        + (displayAsLink ? ' as-link' : '')}`,
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        // if it's a community use the app.vm.activeAccount.chain.id instead of author chain
        const chainId = app.activeCommunityId() ? null : app.activeChainId();
        const communityId = app.activeCommunityId();
        if (hasReacted) {
          const reaction = reactions.find((r) => r.reaction === hasReactedType && r.author === activeAddress);
          vnode.state.loading = true;
          app.reactions.delete(reaction).then(() => {
            if ((hasReactedType === ReactionType.Like && type === ReactionType.Dislike)
              || (hasReactedType === ReactionType.Dislike && type === ReactionType.Like)) {
              app.reactions.create(app.vm.activeAccount.address, post, type, chainId, communityId).then(() => {
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
          app.reactions.create(app.vm.activeAccount.address, post, type, chainId, communityId)
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
    }, (type === ReactionType.Dislike) && [
      m('span.upvote-count', dislikes.length),
      m('span.upvote-icon', m.trust('&#x2193;'))
    ], (type === ReactionType.Like) && [
      m('span.reactions-count', likes.length),
      m('span.reactions-icon', m.trust('&#x2191;')),
    ]);

    return (tooltip && reactors.length) ? m(Tooltip, { content: tooltipPopover }, rxnButton) : rxnButton;
  }
};

export default ReactionButton;
