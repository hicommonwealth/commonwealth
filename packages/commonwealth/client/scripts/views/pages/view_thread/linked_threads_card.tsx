import { slugify } from '@hicommonwealth/shared';
import { filterLinks } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import 'pages/view_thread/linked_threads_card.scss';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import Thread, { LinkSource } from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
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

  const communityId = app.activeChainId() || '';
  const { data: linkedThreads, isLoading } = useGetThreadsByIdQuery({
    community_id: communityId,
    thread_ids: linkedThreadIds.map(Number),
    apiCallEnabled: linkedThreadIds.length > 0 && !!communityId, // only call the api if we have thread id
  });

  return (
    <>
      <CWContentPageCard
        header="Linked Discussions"
        content={
          linkedThreadIds.length > 0 && isLoading ? (
            <div className="spinner-container">
              <CWCircleMultiplySpinner />
            </div>
          ) : (
            <div className="LinkedThreadsCard">
              {linkedThreadIds.length > 0 ? (
                <div className="links-container">
                  {linkedThreads!.map((t) => {
                    // @ts-expect-error SkipNullChecks
                    const tt = new Thread(t);
                    const discussionLink = getProposalUrlPath(
                      tt.slug,
                      `${tt.identifier}-${slugify(t.title)}`,
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
                  buttonHeight="sm"
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
            // @ts-expect-error <StrictNullChecks/>
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
