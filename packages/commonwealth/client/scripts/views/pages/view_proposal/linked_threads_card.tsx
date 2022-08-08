/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/linked_threads_card.scss';

import app from 'state';
import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { Thread } from 'models';
import { LinkedThreadRelation } from 'models/Thread';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';
import { slugify } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';

export class LinkedThreadsCard
  implements
    m.ClassComponent<{
      proposalId: number;
      allowLinking: boolean;
    }>
{
  private fetchLinkedThreads: boolean;
  private linkedThreads: Thread[];
  private loading: boolean;

  oninit() {
    this.fetchLinkedThreads = true;
  }

  view(vnode) {
    const { allowLinking, proposalId } = vnode.attrs;

    const proposal = app.threads.getById(proposalId);

    if (!proposal) return;

    if (!this.linkedThreads) {
      this.linkedThreads = [];
    }

    if (!proposal.linkedThreads?.length) {
      this.fetchLinkedThreads = false;
    }

    if (this.fetchLinkedThreads) {
      this.fetchLinkedThreads = false;
      this.loading = true;
      app.threads
        .fetchThreadsFromId(
          proposal.linkedThreads.map(
            (relation: LinkedThreadRelation) => relation.linkedThread
          )
        )
        .then((result) => {
          this.linkedThreads = result;
          this.loading = false;
        })
        .catch((err) => {
          console.error(err);
          this.loading = false;
        });
      return null;
    }

    if (allowLinking || proposal.linkedThreads.length) {
      return (
        <div class="LinkedThreadsCard">
          <CWText type="h5">Link to an existing thread?</CWText>
          {proposal.linkedThreads.length > 0 && (
            <>
              <h4>Linked Threads</h4>
              <div class="links-container">
                {this.linkedThreads.map((thread) => {
                  const discussionLink = getProposalUrlPath(
                    thread.slug,
                    `${thread.identifier}-${slugify(thread.title)}`
                  );
                  return link('a', discussionLink, thread.title);
                })}
              </div>
            </>
          )}
          {allowLinking && (
            <CWButton
              disabled={this.loading}
              label={
                proposal.linkedThreads?.length
                  ? 'Link another thread'
                  : 'Link threads'
              }
              onclick={(e) => {
                e.preventDefault();
                app.modals.create({
                  modal: LinkedThreadModal,
                  data: {
                    linkingThread: proposal,
                    linkedThreads: this.linkedThreads,
                  },
                });
              }}
            />
          )}
        </div>
      );
    }
  }
}
