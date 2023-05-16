import React from 'react';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';

import 'pages/view_thread/template_action_card.scss';

type TemplateActionCardProps = {
  onButtonClick: () => void;
};

export const TemplateActionCard: React.FC<TemplateActionCardProps> = ({
  onButtonClick,
}) => {
  return (
    <CWContentPageCard
      header="Turn into Proposal"
      content={
        <div className="TemplateActionCard">
          <CWButton
            buttonType="mini-black"
            label="Turn into proposal"
            onClick={onButtonClick}
          />
        </div>
      }
    />
  );
};
