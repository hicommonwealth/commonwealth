import 'pages/view_proposal/header.scss';

import m from 'mithril';
import app from 'state';
import { Button } from 'construct-ui';

import { pluralize, link, externalLink, isSameAccount } from 'helpers';
import { isRoleOfCommunity } from 'helpers/roles';
import { proposalSlugToFriendlyName } from 'identifiers';

import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  Proposal,
  AnyProposal,
  Account,
  Profile,
  ChainBase,
  OffchainTag
} from 'models';
import { NotificationCategories } from 'types';

import TagEditor from 'views/components/tag_editor';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';
import { getStatusClass, getStatusText, getSupportText } from 'views/components/proposal_row';

export const ProposalHeaderAuthor: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!proposal.author) return;

    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community)
        ? app.chain.accounts.get(proposal.author)
        : app.community.accounts.get(proposal.author, proposal.authorChain)
      : proposal.author;

    return m('.ProposalHeaderAuthor', [
      m(User, {
        user: author,
        hideAvatar: true,
        tooltip: true,
      }),
    ]);
  }
};

export const ProposalHeaderCreated: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!proposal.createdAt) return;
    return m('.ProposalHeaderCreated', m('.created', proposal.createdAt.format('MMM D, YYYY')));
  }
};

export const ProposalHeaderComments: m.Component<{ proposal: OffchainThread, nComments: number }> = {
  view: (vnode) => {
    const { proposal, nComments } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderComments', pluralize(nComments, 'comment'));
  }
};

export const ProposalHeaderDelete: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!isSameAccount(app.vm.activeAccount, proposal.author)) return;

    return m('a.ProposalHeaderDelete', {
      href: '#',
      onclick: async (e) => {
        e.preventDefault();
        const confirmed = await confirmationModalWithText('Delete this entire thread?')();
        if (!confirmed) return;
        app.threads.delete(proposal).then(() => {
          m.route.set(`/${app.activeId()}/`);
          // TODO: set notification bar for 'thread deleted'
        });
      },
    }, 'Delete');
  }
}

export const ProposalHeaderExternalLink: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (proposal.kind === OffchainThreadKind.Link) return;
    return m('.ProposalHeaderExternalLink', [
      externalLink('a.external-link', proposal.url, [ 'Open in new window ', m.trust('&rarr;') ]),
    ]);
  }
};

export const ProposalHeaderSpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalHeaderSpacer', m.trust('&middot;'));
  }
};

export const ProposalHeaderTags: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;

    return m('.ProposalHeaderTags', [
      (proposal as OffchainThread).tags?.map((tag) => {
        return link('a', `/${app.activeId()}/discussions/${tag.name}`, `#${tag.name}`);
      }),
      ((app.vm.activeAccount?.address === (proposal as OffchainThread).author) ||
       isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'admin', app.activeId())) &&
        m(TagEditor, {
          thread: proposal as OffchainThread,
          onChangeHandler: (tags: OffchainTag[]) => { (proposal as OffchainThread).tags = tags; m.redraw(); },
        }),
    ]);
  }
};

export const ProposalHeaderTitle: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderTitle', proposal.title);
  }
};

export const ProposalHeaderOnchainId: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderOnchainId', `${proposalSlugToFriendlyName.get(proposal.slug)} ${proposal.shortIdentifier}`);
  }
};

export const ProposalHeaderOnchainStatus: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderOnchainStatus', { class: getStatusClass(proposal) }, getStatusText(proposal, true));
  }
};

export const ProposalHeaderSubscriptionButton: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!app.isLoggedIn()) return;

    const subscription = app.login.notifications.subscriptions.find((v) => v.objectId === proposal.uniqueIdentifier);

    return m(Button, {
      class: 'ProposalHeaderSubscriptionButton',
      disabled: !app.isLoggedIn(),
      intent: subscription?.isActive ? 'primary' : 'none',
      onclick: (e) => {
        e.preventDefault();
        if (subscription?.isActive) {
          app.login.notifications.disableSubscriptions([subscription]).then(() => m.redraw());
        } else {
          app.login.notifications.subscribe(
            NotificationCategories.NewComment, proposal.uniqueIdentifier,
          ).then(() => m.redraw());
        }
      },
      label: subscription?.isActive ?
        [ m('span.icon-bell'), ' Notifications on' ] :
        [ m('span.icon-bell-off'), ' Notifications off' ]
    });
  }
};
