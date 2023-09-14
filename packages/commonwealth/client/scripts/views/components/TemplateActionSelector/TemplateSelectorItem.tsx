import React from 'react';
import { CWCheck } from '../component_kit/cw_icons/cw_icons';
import { CWText } from '../component_kit/cw_text';

import 'components/TemplateSelectorItem.scss';

type TemplateSelectorItemProps = {
  template: any;
  onClick: (template: any) => void;
  isSelected?: boolean;
};

export const TemplateSelectorItem = ({
  template,
  onClick,
  isSelected = false,
}: TemplateSelectorItemProps) => {
  return (
    <div className="TemplateSelectorItem" onClick={() => onClick(template)}>
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
