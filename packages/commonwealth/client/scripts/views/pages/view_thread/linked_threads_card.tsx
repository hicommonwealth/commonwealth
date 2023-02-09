import React from 'react';

import { getProposalUrlPath } from 'identifiers';
import type { Thread } from 'models';
import type { LinkedThreadRelation } from 'models/Thread';

import { ClassComponent, ResultNode } from 'mithrilInterop';

import 'pages/view_thread/linked_threads_card.scss';

import app from 'state';
import { slugify } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';

type LinkedThreadsCardAttrs = {
  allowLinking: boolean;
  threadId: number;
};

export class LinkedThreadsCard extends ClassComponent<LinkedThreadsCardAttrs> {
  private initialized: boolean;
  private linkedThreads: Thread[] = [];

  view(vnode: ResultNode<LinkedThreadsCardAttrs>) {
    const { allowLinking, threadId } = vnode.attrs;

    const thread = app.threads.getById(threadId);

    if (thread.linkedThreads.length > 0 && !this.initialized) {
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
        header="Linked Discussions"
        content={
          <div className="LinkedThreadsCard">
            {thread.linkedThreads.length > 0 ? (
              <div className="links-container">
                {this.linkedThreads.map((t) => {
                  const discussionLink = getProposalUrlPath(
                    t.slug,
                    `${t.identifier}-${slugify(t.title)}`
                  );

                  return <a href={discussionLink}>{t.title}</a>;
                })}
              </div>
            ) : (
              <CWText type="b2" className="no-threads-text">
                There are currently no linked discussions.
              </CWText>
            )}
            {allowLinking && (
              <CWButton
                buttonType="mini-black"
                label="Link discussion"
                onClick={(e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: LinkedThreadModal,
                    data: {
                      linkingThread: thread,
                      linkedThreads: this.linkedThreads,
                    },
                  });
                  this.redraw();
                }}
              />
            )}
          </div>
        }
      />
    );
  }
}
