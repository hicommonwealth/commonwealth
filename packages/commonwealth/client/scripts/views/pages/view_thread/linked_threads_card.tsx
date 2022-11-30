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
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';

type LinkedThreadsCardAttrs = {
  allowLinking: boolean;
  threadlId: number;
};

export class LinkedThreadsCard
  implements m.ClassComponent<LinkedThreadsCardAttrs>
{
  private initialized: boolean;
  private linkedThreads: Thread[] = [];

  view(vnode: m.Vnode<LinkedThreadsCardAttrs>) {
    const { allowLinking, threadlId } = vnode.attrs;

    const thread = app.threads.getById(threadlId);

    if (!this.initialized) {
      this.initialized = true;

      app.threads
        .fetchThreadsFromId(
          thread.linkedThreads.map(
            (relation: LinkedThreadRelation) => relation.linkedThread
          )
        )
        .then((result) => {
          this.linkedThreads = result;
          this.initialized = false;
        })
        .catch((err) => {
          console.error(err);
          this.initialized = false;
        });
    }

    return (
      <CWContentPageCard
        header={
          thread.linkedThreads.length === 0
            ? 'Link to an existing thread?'
            : 'Linked Threads'
        }
        content={
          <div class="LinkedThreadsCard">
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
                disabled={!this.initialized}
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
        }
      />
    );
  }
}
