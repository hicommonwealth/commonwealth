import React, { useState } from 'react';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { TemplateActionModal } from '../../modals/template_action_modal'; // Import the new modal component

import 'pages/view_thread/template_action_card.scss';

type TemplateActionCardProps = {
  threadContent: string; // Pass the thread content to the modal
};

export const TemplateActionCard = ({
  threadContent,
}: TemplateActionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <CWContentPageCard
        header="Turn into Proposal"
        content={
          <div className="TemplateActionCard">
            <CWButton
              buttonType="primary-black"
              label="Turn into proposal"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        }
      />
      <TemplateActionModal
        isOpen={isModalOpen}
        threadContent={threadContent}
        onSave={() => setIsModalOpen(false)}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
