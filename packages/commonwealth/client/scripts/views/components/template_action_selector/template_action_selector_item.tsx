import React from 'react';
import { CWCheck } from '../component_kit/cw_icons/cw_icons';
import { CWText } from '../component_kit/cw_text';

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
    <div className="template-item" onClick={onClick}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <CWText fontWeight="medium" truncate noWrap>
          <div id={template.name}></div> {template.name}
        </CWText>
        <CWText type="caption" truncate>
          {template.created_by
            ? `Created By: ${template.created_by}`
            : 'No creator information'}
        </CWText>
      </div>
    </div>
  );
};
