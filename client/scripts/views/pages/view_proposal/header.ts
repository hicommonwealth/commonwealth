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
    if (!proposal.tag) return;

    const tagColor = '#72b483';

    return m('.ProposalHeaderTags', [
      link('a.proposal-tag', `/${app.activeId()}/discussions/${proposal.tag.name}`, [
        m('span.proposal-tag-icon', { style: `background: ${tagColor}` }),
        m('span.proposal-tag-name', `${proposal.tag?.name}`),
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
        label: proposal.readOnly ? 'Turn on commenting' : 'Turn off commenting',
      }),
      // privacy toggle, show only if thread is private
      (proposal as OffchainThread).privacy && m(MenuItem, {
        class: 'privacy-to-public-toggle',
        onclick: (e) => {
          e.preventDefault();
          app.threads.edit(proposal, null, null, false, true).then(() => m.redraw());
        },
        label: 'Reveal to public',
      }),
    ];
  }
};
