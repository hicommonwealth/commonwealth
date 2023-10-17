import { filterLinks } from 'helpers/threads';
import 'pages/view_thread/linked_threads_card.scss';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type Thread from '../../../models/Thread';
import { LinkSource } from '../../../models/Thread';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/CWContentPage';
import { CWText } from '../../components/component_kit/cw_text';
import { LinkedUrlModal } from '../../modals/linked_url_modal';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';

type LinkedUrlCardProps = {
  thread: Thread;
  allowLinking: boolean;
};

export const LinkedUrlCard = ({ thread, allowLinking }: LinkedUrlCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const linkedUrls = useMemo(
    () => filterLinks(thread.links, LinkSource.Web),
    [thread.links]
  );

  return (
    <>
      <CWContentPageCard
        header="Web Links"
        content={
          <div className="LinkedThreadsCard">
            {linkedUrls.length > 0 ? (
              <div className="links-container">
                {linkedUrls.map((t) => {
                  return (
                    <Link key={t.identifier} to={t.identifier} target="_blank">
                      {t.title}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <CWText type="b2" className="no-threads-text">
                There are currently no linked pages.
              </CWText>
            )}
            {allowLinking && (
              <CWButton
                buttonType="mini-black"
                label="Manage Links"
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </div>
        }
      />
      <CWModal
        size="small"
        content={
          <LinkedUrlModal
            thread={thread}
            urlLinks={linkedUrls}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
