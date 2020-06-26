import 'pages/view_proposal/header.scss';

import m from 'mithril';
import moment from 'moment';
import app from 'state';

import { Button, Icon, Icons, Tag, MenuItem } from 'construct-ui';

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

    return m(MenuItem, {
      class: 'ProposalHeaderDelete',
      label: 'Delete thread',
      iconLeft: Icons.DELETE,
      onclick: async (e) => {
        e.preventDefault();
        const confirmed = await confirmationModalWithText('Delete this entire thread?')();
        if (!confirmed) return;
        app.threads.delete(proposal).then(() => {
          m.route.set(`/${app.activeId()}/`);
          // TODO: set notification bar for 'thread deleted'
        });
      },
    });
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

export const ProposalHeaderPrivacyButtons: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;

    return [
      m(MenuItem, {
        class: 'read-only-toggle',
        onclick: (e) => {
          e.preventDefault();
          app.threads.edit(proposal, null, null, !proposal.readOnly).then(() => m.redraw());
        },
        iconLeft: proposal.readOnly ? Icons.UNLOCK : Icons.LOCK,
        label: proposal.readOnly ? 'Enable commenting' : 'Disable commenting',
      }),
      // privacy toggle, show only if thread is private
      (proposal as OffchainThread).privacy && m(MenuItem, {
        class: 'privacy-to-public-toggle',
        onclick: (e) => {
          e.preventDefault();
          app.threads.edit(proposal, null, null, false, true).then(() => m.redraw());
        },
        label: 'Make public',
      }),
    ];
  }
};
