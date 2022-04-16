/* @jsx m */

import m from 'mithril';
import { Button, Tag, MenuItem, Input } from 'construct-ui';

// import 'pages/view_proposal/header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { pluralize, link, offchainThreadStageToLabel } from 'helpers';
import { getProposalUrlPath, proposalSlugToFriendlyName } from 'identifiers';
import { OffchainThread, OffchainThreadStage, AnyProposal } from 'models';
import { notifySuccess } from 'controllers/app/notifications';
import { getStatusClass, getStatusText } from 'views/components/proposal_card';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { activeQuillEditorHasText, GlobalStatus } from './body';
import { IProposalPageState } from '.';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

export const ProposalHeaderSpacer: m.Component<{}> = {
  view: () => {
    return m('.ProposalHeaderSpacer', m.trust('&middot;'));
  },
};

export const ProposalHeaderTopics: m.Component<{
  proposal: AnyProposal | OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (!proposal.topic) return;

    return m('.ProposalHeaderTopics', [
      link(
        'a.proposal-topic',
        `/${app.activeChainId()}/discussions/${proposal.topic.name}`,
        [m('span.proposal-topic-name', `${proposal.topic?.name}`)]
      ),
    ]);
  },
};

export const ProposalHeaderTitle: m.Component<{
  proposal: AnyProposal | OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderTitle', [
      proposal.title,
      proposal instanceof OffchainThread &&
        proposal.readOnly &&
        m(Tag, {
          size: 'xs',
          label: [
            m(CWIcon, { iconName: 'lock', iconSize: 'small' }),
            ' Locked',
          ],
        }),
    ]);
  },
};

export const ProposalHeaderStage: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (proposal.stage === OffchainThreadStage.Discussion) return;

    return m(
      'a.ProposalHeaderStage',
      {
        href: `/${proposal.chain || proposal.community}?stage=${
          proposal.stage
        }`,
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage(`?stage=${proposal.stage}`);
        },
        class:
          proposal.stage === OffchainThreadStage.ProposalInReview
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Voting
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Passed
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Failed
            ? 'negative'
            : 'positive',
      },
      offchainThreadStageToLabel(proposal.stage)
    );
  },
};

export const ProposalHeaderOnchainId: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m(
      '.ProposalHeaderOnchainId',
      `${proposalSlugToFriendlyName.get(proposal.slug)} ${
        proposal.shortIdentifier
      }`
    );
  },
};

export const ProposalHeaderOnchainStatus: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m(
      '.ProposalHeaderOnchainStatus',
      { class: getStatusClass(proposal) },
      getStatusText(proposal, true)
    );
  },
};

export const ProposalHeaderViewCount: m.Component<{ viewCount: number }> = {
  view: (vnode) => {
    const { viewCount } = vnode.attrs;
    return m('.ViewCountBlock', pluralize(viewCount, 'view'));
  },
};

export const ProposalTitleEditMenuItem: m.Component<{
  item: AnyProposal;
  proposalPageState: IProposalPageState;
  getSetGlobalEditingStatus: CallableFunction;
  parentState;
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;
    if (!item) return;

    return m(MenuItem, {
      label: 'Edit title',
      class: 'edit-proposal-title',
      onclick: async (e) => {
        e.preventDefault();
        if (proposalPageState.replying) {
          if (activeQuillEditorHasText()) {
            const confirmed = await confirmationModalWithText(
              'Unsubmitted replies will be lost. Continue?'
            )();
            if (!confirmed) return;
          }
          proposalPageState.replying = false;
          proposalPageState.parentCommentId = null;
        }
        parentState.editing = true;
        getSetGlobalEditingStatus(GlobalStatus.Set, true);
      },
    });
  },
};

// Component for saving chain proposal titles
export const ProposalTitleSaveEdit: m.Component<{
  proposal: AnyProposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;
    if (!proposal) return;
    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    return m('.ProposalTitleSaveEdit', [
      m(
        Button,
        {
          class: 'save-editing',
          label: 'Save',
          disabled: parentState.saving,
          intent: 'primary',
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            parentState.saving = true;
            app.chain.chainEntities
              .updateEntityTitle(
                proposal.uniqueIdentifier,
                parentState.updatedTitle
              )
              .then(() => {
                m.route.set(proposalLink);
                parentState.editing = false;
                parentState.saving = false;
                getSetGlobalEditingStatus(GlobalStatus.Set, false);
                proposal.title = parentState.updatedTitle;
                m.redraw();
                notifySuccess('Thread successfully edited');
              });
          },
        },
        'Save'
      ),
    ]);
  },
};

export const ProposalTitleCancelEdit: m.Component<{
  proposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  view: (vnode) => {
    const { getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalTitleCancelEdit', [
      m(
        Button,
        {
          class: 'cancel-editing',
          label: 'Cancel',
          disabled: parentState.saving,
          intent: 'none',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            parentState.editing = false;
            parentState.saving = false;
            getSetGlobalEditingStatus(GlobalStatus.Set, false);
            m.redraw();
          },
        },
        'Cancel'
      ),
    ]);
  },
};

export const ProposalTitleEditor: m.Component<{
  item: OffchainThread | AnyProposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  },
  view: (vnode) => {
    const { item, parentState, getSetGlobalEditingStatus } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalTitleEditor', [
      m(Input, {
        size: 'lg',
        name: 'edit-thread-title',
        autocomplete: 'off',
        oninput: (e) => {
          const { value } = (e as any).target;
          parentState.updatedTitle = value;
        },
        defaultValue: parentState.updatedTitle,
        tabindex: 1,
      }),
      !isThread &&
        m('.proposal-title-buttons', [
          m(ProposalTitleSaveEdit, {
            proposal: item as AnyProposal,
            getSetGlobalEditingStatus,
            parentState,
          }),
          m(ProposalTitleCancelEdit, {
            proposal: item as AnyProposal,
            getSetGlobalEditingStatus,
            parentState,
          }),
        ]),
    ]);
  },
};

export const ProposalLinkEditor: m.Component<{
  item: OffchainThread | AnyProposal;
  parentState;
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedUrl = (
      vnode.attrs.item as OffchainThread
    ).url;
  },
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    if (!item) return;

    return m('.ProposalLinkEditor', [
      m(Input, {
        size: 'lg',
        name: 'edit-thread-url',
        autocomplete: 'off',
        oninput: (e) => {
          const { value } = (e as any).target;
          parentState.updatedUrl = value;
        },
        defaultValue: parentState.updatedUrl,
        tabindex: 1,
      }),
    ]);
  },
};

export const ProposalHeaderPrivacyMenuItems: m.Component<{
  proposal: AnyProposal | OffchainThread;
  getSetGlobalEditingStatus: CallableFunction;
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;

    return [
      m(MenuItem, {
        class: 'read-only-toggle',
        onclick: (e) => {
          e.preventDefault();
          app.threads
            .setPrivacy({
              threadId: proposal.id,
              readOnly: !proposal.readOnly,
            })
            .then(() => {
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              m.redraw();
            });
        },
        label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
      }),
    ];
  },
};
