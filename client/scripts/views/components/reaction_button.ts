import 'components/reaction_button.scss';

import { default as m, VnodeDOM } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';

import app from 'state';
import { IUniqueId, Proposal, OffchainComment, OffchainThread, AnyProposal } from 'models';

export enum ReactionType {
  Like = 'like',
  Dislike = 'dislike'
}

interface IAttrs {
  post: AnyProposal | OffchainThread | OffchainComment<any>;
  type: ReactionType;
  displayAsLink?: boolean;
}

const ReactionButton: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    const { post, type, displayAsLink } = vnode.attrs;
    const reactions = app.reactions.getByPost(post);

    let dislikes;
    let likes;
    if (type === ReactionType.Like) likes = reactions.filter((r) => r.reaction === 'like');
    if (type === ReactionType.Dislike) dislikes = reactions.filter((r) => r.reaction === 'dislike');

    const disabled = !app.vm.activeAccount;
    const activeAddress = app.vm.activeAccount?.address;
    const rxn = reactions.find((r) => r.reaction && r.author === activeAddress);
    const hasReacted : boolean = !!rxn;
    let hasReactedType;
    if (hasReacted) hasReactedType = rxn.reaction;

    return m('.ReactionButton', {
      class: (disabled ? 'disabled' : type === hasReactedType ? 'active' : '') +
        (displayAsLink ? ' as-link' : ''),
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        const chainId = app.activeCommunityId() ? null : app.activeChainId();
        const communityId = app.activeCommunityId();

        if (hasReacted) {
          const reaction = reactions.find((r) => r.reaction === hasReactedType && r.author === activeAddress);
          app.reactions.delete(reaction).then(() => m.redraw());
          if ((hasReactedType === ReactionType.Like && type === ReactionType.Dislike)
            || (hasReactedType === ReactionType.Dislike && type === ReactionType.Like)) {
            app.reactions.create(app.vm.activeAccount.address, post, type, chainId, communityId)
              .then(() => m.redraw());
          }
        } else {
          app.reactions.create(app.vm.activeAccount.address, post, type, chainId, communityId)
            .then(() => m.redraw());
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
  }
};

export default ReactionButton;
