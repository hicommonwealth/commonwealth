import { filterLinks } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import 'pages/view_thread/linked_threads_card.scss';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { slugify } from '../../../../../shared/utils';
import type Thread from '../../../models/Thread';
import { LinkSource } from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { LinkedThreadModal } from '../../modals/linked_thread_modal';

type LinkedThreadsCardProps = {
  thread: Thread;
  allowLinking: boolean;
};

export const LinkedThreadsCard = ({
  thread,
  allowLinking,
}: LinkedThreadsCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const linkedThreadIds = useMemo(
    () =>
      filterLinks(thread.links, LinkSource.Thread).map(
        ({ identifier }) => identifier,
      ),
    [thread.links],
  );

  const { data: linkedThreads, isLoading } = useGetThreadsByIdQuery({
    chainId: app.activeChainId(),
    ids: linkedThreadIds.map(Number),
    apiCallEnabled: linkedThreadIds.length > 0, // only call the api if we have thread id
  });

  return (
    <>
      <CWContentPageCard
        header="Linked Discussions"
        content={
          linkedThreadIds.length > 0 && isLoading ? (
            <div className="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div className="LinkedThreadsCard">
              {linkedThreadIds.length > 0 ? (
                <div className="links-container">
                  {linkedThreads.map((t) => {
                    const discussionLink = getProposalUrlPath(
                      t.slug,
                      `${t.identifier}-${slugify(t.title)}`,
                      false,
                    );

                    return (
                      <Link key={t.id} to={`${discussionLink}?tab=0`}>
                        {t.title}
                      </Link>
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
      <CWModal
        size="small"
        content={
          <LinkedThreadModal
            thread={thread}
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
