import m from 'mithril';
import { Button, List, ListItem } from 'construct-ui';

import app from 'state';
import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { OffchainThread } from 'models';
import { LinkedThreadRelation } from 'client/scripts/models/OffchainThread';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';
import { slugify } from '../../../../../shared/utils';

export const ProposalSidebarPollEditorModule: m.Component<
  {
    proposal;
    openPollEditor: () => void;
  },
  {
    isOpen: boolean;
  }
> = {
  view: (vnode) => {
    const { proposal, openPollEditor } = vnode.attrs;
    return m('.ProposalSidebarPollEditorModule', [
      m('.placeholder-copy', 'Add an offchain poll to this thread?'),
      m(Button, {
        rounded: true,
        compact: true,
        fluid: true,
        disabled: !!proposal.offchainVotingEndsAt,
        label: proposal.offchainVotingEndsAt
          ? 'Polling enabled'
          : 'Create a poll',
        onclick: (e) => {
          e.preventDefault();
          openPollEditor();
        },
      }),
    ]);
  },
};

export const ProposalLinkedThreadsEditorModule: m.Component<
  {
    proposalId: number;
    allowLinking: boolean;
  },
  {
    fetchLinkedThreads: boolean;
    loading: boolean;
    linkedThreads: OffchainThread[];
  }
> = {
  oninit: (vnode) => {
    vnode.state.fetchLinkedThreads = true;
  },
  view: (vnode) => {
    const { allowLinking, proposalId } = vnode.attrs;
    const proposal = app.threads.getById(proposalId);
    if (!proposal) return;
    if (!vnode.state.linkedThreads) {
      vnode.state.linkedThreads = [];
    }
    if (!proposal.linkedThreads?.length) {
      vnode.state.fetchLinkedThreads = false;
    }
    if (vnode.state.fetchLinkedThreads) {
      vnode.state.fetchLinkedThreads = false;
      vnode.state.loading = true;
      app.threads
        .fetchThreadsFromId(
          proposal.linkedThreads.map(
            (relation: LinkedThreadRelation) => relation.linkedThread
          )
        )
        .then((result) => {
          vnode.state.linkedThreads = result;
          vnode.state.loading = false;
        })
        .catch((err) => {
          console.error(err);
          vnode.state.loading = false;
        });
      return null;
    }
    if (allowLinking || proposal.linkedThreads.length) {
      return m('.ProposalLinkedThreadsEditorModule', [
        !!vnode.state.linkedThreads?.length &&
          m('.linked-threads-title', 'Linked Threads:'),
        m(
          List,
          vnode.state.linkedThreads.map((thread) => {
            const discussionLink = getProposalUrlPath(
              thread.slug,
              `${thread.identifier}-${slugify(thread.title)}`
            );
            return m(ListItem, {
              label: link('a.linked-thread', discussionLink, thread.title),
            });
          })
        ),
        allowLinking &&
          m(Button, {
            disabled: vnode.state.loading,
            rounded: true,
            compact: true,
            fluid: true,
            label: proposal.linkedThreads?.length
              ? 'Link another thread'
              : 'Link threads',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: LinkedThreadModal,
                data: {
                  linkingThread: proposal,
                  linkedThreads: vnode.state.linkedThreads,
                },
              });
            },
          }),
      ]);
    }
  },
};
