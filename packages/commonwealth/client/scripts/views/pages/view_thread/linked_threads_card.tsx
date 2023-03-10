import React, { useEffect, useState } from 'react';

import { getProposalUrlPath } from 'identifiers';
import type { Thread } from 'models';

import 'pages/view_thread/linked_threads_card.scss';

import app from 'state';
import { slugify } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';
import { Modal } from '../../components/component_kit/cw_modal';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';

type LinkedThreadsCardProps = {
  thread: Thread;
  allowLinking: boolean;
  onChangeHandler: (linkedThreads: Thread[]) => void;
};

export const LinkedThreadsCard = ({
  thread,
  allowLinking,
  onChangeHandler,
}: LinkedThreadsCardProps) => {
  const [linkedThreads, setLinkedThreads] = useState<Array<Thread>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);

  useEffect(() => {
    if (thread.linkedThreads.length > 0) {
      const linkedThreadIds = thread.linkedThreads.map(
        ({ linkedThread }) => linkedThread
      );

      app.threads
        .fetchThreadsFromId(linkedThreadIds)
        .then((data) => {
          setLinkedThreads(data);
          setThreadsLoaded(true);
        })
        .catch(console.error);
    } else {
      setLinkedThreads([]);
    }
  }, [thread?.linkedThreads]);

  return (
    <>
      <CWContentPageCard
        header="Linked Discussions"
        content={
          thread.linkedThreads.length && !threadsLoaded ? (
            <div className="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div className="LinkedThreadsCard">
              {thread.linkedThreads.length > 0 ? (
                <div className="links-container">
                  {linkedThreads.map((t) => {
                    const discussionLink = getProposalUrlPath(
                      t.slug,
                      `${t.identifier}-${slugify(t.title)}`,
                      false
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
                  onClick={() => setIsModalOpen(true)}
                />
              )}
            </div>
          )
        }
      />
      <Modal
        content={
          <LinkedThreadModal
            thread={thread}
            linkedThreads={linkedThreads}
            onSave={onChangeHandler}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
