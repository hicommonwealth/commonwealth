import 'pages/view_proposal/header.scss';

import m from 'mithril';
import moment from 'moment';
import app from 'state';

import { Button, Icon, Icons, Tag } from 'construct-ui';

import { updateRoute } from 'app';
import { pluralize, link, externalLink, isSameAccount, extractDomain } from 'helpers';
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
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';

export const ProposalHeaderAuthor: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!proposal.author) return;

    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community
        ? app.chain.accounts.get(proposal.author)
        : app.community.accounts.get(proposal.author, proposal.authorChain))
      : proposal.author;

    return m('.ProposalHeaderAuthor', [
      m(User, {
        user: author,
        tooltip: true,
        linkify: true,
        hideAvatar: true,
      }),
    ]);
  }
};

export const ProposalHeaderCreated: m.Component<{ proposal: AnyProposal | OffchainThread, link: string }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const proposalLink = vnode.attrs.link;
    if (!proposal) return;
    if (!proposal.createdAt) return;

    return m('.ProposalHeaderCreated', [
      m('a', {
        href: `${proposalLink}?comment=body`,
        onclick: (e) => {
          e.preventDefault();
          updateRoute(`${proposalLink}?comment=body`);
          jumpHighlightComment('body', false, 500);
        }
      }, proposal.createdAt.format('MMM D, YYYY'))
    ]);
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
        onclick: (e) => {
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

export const ProposalHeaderDelete: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!isSameAccount(app.user.activeAccount, proposal.author)) return;

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
};

export const ProposalHeaderExternalLink: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.kind !== OffchainThreadKind.Link) return;
    return m('.ProposalHeaderExternalLink', [
      externalLink('a.external-link', proposal.url, [ extractDomain(proposal.url), m.trust(' &rarr;') ]),
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

    const canEdit = (app.user.activeAccount?.address === proposal.author
                     && app.user.activeAccount?.chain.id === proposal.authorChain)
      || app.user.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });

    return m('.ProposalHeaderTags', [
      m('span.proposal-header-tags', [
        m(Tag, {
          rounded: true,
          intent: 'none',
          size: 'xs',
          onclick: (e) => m.route.set(`/${app.activeId()}/discussions/${proposal.tag.name}`),
          label: `#${proposal.tag?.name}`
        })
      ]),
      canEdit && proposal.tag && m(ProposalHeaderSpacer),
      canEdit && m(TagEditor, {
        thread: proposal,
        onChangeHandler: (tag: OffchainTag) => { proposal.tag = tag; m.redraw(); },
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
    return m(
      '.ProposalHeaderOnchainId',
      `${proposalSlugToFriendlyName.get(proposal.slug)} ${proposal.shortIdentifier}`
    );
  }
};

export const ProposalHeaderOnchainStatus: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderOnchainStatus', { class: getStatusClass(proposal) }, getStatusText(proposal, true));
  }
};

export const ProposalHeaderViewCount: m.Component<{ viewCount: number }> = {
  view: (vnode) => {
    const { viewCount } = vnode.attrs;
    return m('.ViewCountBlock', pluralize(viewCount, 'view'));
  }
};

export const ProposalHeaderSubscriptionButton: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!app.isLoggedIn()) return;

    const subscription = app.user.notifications.subscriptions.find((v) => v.objectId === proposal.uniqueIdentifier);

    return m(Button, {
      class: 'ProposalHeaderSubscriptionButton',
      disabled: !app.isLoggedIn(),
      intent: subscription?.isActive ? 'primary' : 'none',
      onclick: (e) => {
        e.preventDefault();
        if (subscription?.isActive) {
          app.user.notifications.disableSubscriptions([subscription]).then(() => m.redraw());
        } else {
          app.user.notifications.subscribe(
            NotificationCategories.NewComment, proposal.uniqueIdentifier,
          ).then(() => m.redraw());
        }
      },
      label: subscription?.isActive
        ? [ m('span.icon-bell'), ' Notifications on' ]
        : [ m('span.icon-bell-off'), ' Notifications off' ]
    });
  }
};

export const ProposalHeaderPrivacyButtons: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (!app.isLoggedIn()) return;

    const canEdit = app.user.activeAccount?.address === proposal.author
      && app.user.activeAccount?.chain.id === proposal.authorChain;
    if (!canEdit) return;

    return m('.ProposalHeaderPrivacyButtons', [
      // read only toggle
      m(Button, {
        class: 'read-only-toggle',
        onclick: (e) => {
          e.preventDefault();
          app.threads.edit(proposal, null, null, !proposal.readOnly).then(() => m.redraw());
        },
        label: proposal.readOnly ? 'Make Commentable?' : 'Make Read-Only?'
      }),
      // privacy toggle, show only if thread is private
      (proposal as OffchainThread).privacy
        && m(Button, {
          class: 'privacy-to-public-toggle',
          onclick: (e) => {
            e.preventDefault();
            app.threads.edit(proposal, null, null, false, true).then(() => m.redraw());
          },
          label: 'Make Thread Public',
        }),
    ]);
  }
};
