import 'pages/view_proposal/header.scss';

import m from 'mithril';
import moment from 'moment';
import app from 'state';

import { Button, Icon, Icons } from 'construct-ui';

import { updateRoute } from 'app';
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
import VersionHistoryModal from 'views/modals/version_history_modal';
import { jumpHighlightComment } from 'views/pages/view_proposal/jump_to_comment';

export const ProposalHeaderAuthor: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
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

export const ProposalHeaderCreated: m.Component<{ proposal: AnyProposal | OffchainThread, link: string }> = {
  view: (vnode) => {
    const { proposal, link } = vnode.attrs;
    if (!proposal) return;
    if (!proposal.createdAt) return;

    return m('.ProposalHeaderCreated', {
      href: `${link}?comment=body`,
      onclick: (e) => {
        e.preventDefault();
        updateRoute(`${link}?comment=body`);
        jumpHighlightComment('body', false, 500);
      }
    }, proposal.createdAt.format('MMM D, YYYY'));
  }
};

export const ProposalHeaderLastEdited: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.versionHistory?.length <= 1) return;
    const lastEdit = JSON.parse(proposal.versionHistory[0]);

    return m('.ProposalHeaderLastEdited', [
      m('a', {
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
          app.modals.create({
            modal: VersionHistoryModal,
            data: { proposal },
          });
        }
      }, [
        'Edited ',
        moment(lastEdit.timestamp).fromNow()
      ])
    ]);
  }
};



export const ProposalHeaderComments: m.Component<{ proposal: AnyProposal | OffchainThread, nComments: number }> = {
  view: (vnode) => {
    const { proposal, nComments } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderComments', [
      nComments,
      m(Icon, { name: Icons.MESSAGE_SQUARE }),
    ]);
  }
};

export const ProposalHeaderDelete: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!isSameAccount(app.vm.activeAccount, proposal.author)) return;

    return m('.ProposalHeaderDelete', [
      m('a', {
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
      }, 'Delete')
    ]);
  }
}

export const ProposalHeaderExternalLink: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.kind !== OffchainThreadKind.Link) return;
    return m('.ProposalHeaderExternalLink', [
      externalLink('a.external-link', proposal.url, [ 'Open ', m.trust('&rarr;') ]),
    ]);
  }
};

export const ProposalHeaderSpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalHeaderSpacer', m.trust('&middot;'));
  }
};

export const ProposalHeaderTags: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;

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

export const ProposalHeaderTitle: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
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

export const ProposalHeaderSubscriptionButton: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
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
