import React from 'react';
import { CWCheck } from '../component_kit/cw_icons/cw_icons';

import 'modals/template_action_modal.scss';

type TemplateSelectorItemProps = {
  template: any;
  onClick: () => void;
  isSelected?: boolean;
};

export const TemplateSelectorItem = ({
  template,
  onClick,
  isSelected = false,
}: TemplateSelectorItemProps) => {
  return (
    <div className="TemplateSelectorItem" onClick={onClick}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="template-nickname">{template.name}</div>
      <div className="template-contract-address">
        Created By: {template.created_by}
      </div>
    </div>
  );
};
