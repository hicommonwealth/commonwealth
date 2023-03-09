import React, { useEffect, useState } from 'react';

import { getProposalUrlPath } from 'identifiers';
import type { Thread } from 'models';
import type { LinkedThreadRelation } from 'models/Thread';

import 'pages/view_thread/linked_threads_card.scss';

import app from 'state';
import { slugify } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';
import { Modal } from '../../components/component_kit/cw_modal';

type LinkedThreadsCardProps = {
  allowLinking: boolean;
  threadId: number;
};

export const LinkedThreadsCard = ({
  allowLinking,
  threadId,
}: LinkedThreadsCardProps) => {
  const [linkedThreads, setLinkedThreads] = useState<Array<Thread>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const thread = app.threads.getById(threadId);

  useEffect(() => {
    if (thread.linkedThreads.length > 0) {
      app.threads
        .fetchThreadsFromId(
          thread.linkedThreads.map(
            (relation: LinkedThreadRelation) => relation.linkedThread
          )
        )
        .then((result) => {
          setLinkedThreads(result);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [thread?.linkedThreads]);

  return (
    <>
      <CWContentPageCard
        header="Linked Discussions"
        content={
          <div className="LinkedThreadsCard">
            {thread.linkedThreads.length > 0 ? (
              <div className="links-container">
                {linkedThreads.map((t) => {
                  const discussionLink = getProposalUrlPath(
                    t.slug,
                    `${t.identifier}-${slugify(t.title)}`,
                    true
                  );

                  return (
                    <a key={t.id} href={discussionLink}>
                      {t.title}
                    </a>
                  );
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
                  setIsModalOpen(true);
                }}
              />
            )}
          </div>
        }
      />
      <Modal
        content={
          <LinkedThreadModal
            linkingThread={thread}
            linkedThreads={linkedThreads}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
