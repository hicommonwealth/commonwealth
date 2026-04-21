import { filterLinks } from 'helpers/threads';
import React, { useMemo, useState } from 'react';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import type Thread from '../../../models/Thread';
import { LinkSource } from '../../../models/Thread';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { LinkedUrlModal } from '../../modals/linked_url_modal';
import './linked_threads_card.scss';

type LinkedUrlCardProps = {
  thread: Thread;
  allowLinking: boolean;
  actionOnly?: boolean;
  actionLabel?: string;
};

export const LinkedUrlCard = ({
  thread,
  allowLinking,
  actionOnly = false,
  actionLabel = 'Manage Links',
}: LinkedUrlCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const linkedUrls = useMemo(
    () => filterLinks(thread.links, LinkSource.Web),
    [thread.links],
  );

  return (
    <>
      {!actionOnly && (
        <div className="LinkedThreadsCard">
          <CWText type="h4" className="LinkedThreadsCard-title">
            Link a Web Page
          </CWText>
          <CWText type="b2" className="no-threads-text">
            Use the action below to manage linked pages.
          </CWText>
          {allowLinking && (
            <CWButton
              buttonHeight="sm"
              label={actionLabel}
              onClick={() => setIsModalOpen(true)}
            />
          )}
        </div>
      )}
      {actionOnly && allowLinking && (
        <CWButton
          buttonHeight="sm"
          label={actionLabel}
          onClick={() => setIsModalOpen(true)}
        />
      )}
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
