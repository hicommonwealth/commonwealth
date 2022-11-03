/* @jsx m */

import m from 'mithril';

import 'pages/view_thread/linked_threads_card.scss';

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
      threadlId: number;
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
    const { allowLinking, threadlId } = vnode.attrs;

    const thread = app.threads.getById(threadlId);

    if (!thread) return;

    if (!this.linkedThreads) {
      this.linkedThreads = [];
    }

    if (!thread.linkedThreads?.length) {
      this.fetchLinkedThreads = false;
    }

    if (this.fetchLinkedThreads) {
      this.fetchLinkedThreads = false;
      this.loading = true;

      app.threads
        .fetchThreadsFromId(
          thread.linkedThreads.map(
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

    if (allowLinking || thread.linkedThreads.length) {
      return (
        <div class="LinkedThreadsCard">
          <CWText type="h5">
            {thread.linkedThreads.length === 0
              ? 'Link to an existing thread?'
              : 'Linked Threads'}
          </CWText>
          {thread.linkedThreads.length > 0 && (
            <div class="links-container">
              {this.linkedThreads.map((t) => {
                const discussionLink = getProposalUrlPath(
                  t.slug,
                  `${t.identifier}-${slugify(t.title)}`
                );

                return link('a', discussionLink, t.title);
              })}
            </div>
          )}
          {allowLinking && (
            <CWButton
              disabled={this.loading}
              label={
                thread.linkedThreads?.length
                  ? 'Link another thread'
                  : 'Link threads'
              }
              onclick={(e) => {
                e.preventDefault();
                app.modals.create({
                  modal: LinkedThreadModal,
                  data: {
                    linkingThread: thread,
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
