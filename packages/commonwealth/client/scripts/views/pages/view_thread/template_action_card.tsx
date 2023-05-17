import React, { useState } from 'react';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { TemplateActionModal } from '../../modals/template_action_modal'; // Import the new modal component

import 'pages/view_thread/template_action_card.scss';
import Thread, { Link } from 'client/scripts/models/Thread';
import { Modal } from '../../components/component_kit/cw_modal';

type TemplateActionCardProps = {
  thread: Thread; // Pass the thread content to the modal
  onChangeHandler: (links?: Link[]) => void;
};

export const TemplateActionCard = ({
  thread,
  onChangeHandler,
}: TemplateActionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <CWContentPageCard
        header="Add Template"
        content={
          <div className="TemplateActionCard">
            <CWButton
              buttonType="mini-black"
              label="Add Template"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        }
      />
      <Modal
        content={
          <TemplateActionModal
            isOpen={isModalOpen}
            thread={thread}
            onSave={() => onChangeHandler}
            onClose={() => setIsModalOpen(false)}
          />
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
