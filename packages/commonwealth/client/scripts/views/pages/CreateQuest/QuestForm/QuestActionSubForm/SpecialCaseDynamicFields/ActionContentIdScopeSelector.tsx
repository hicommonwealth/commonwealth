import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { QuestActionContentIdScope } from '../types';
import { SpecialCaseDynamicFieldsProps } from './types';

const ActionContentIdScopeSelector = ({
  defaultValues,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.with_optional_thread_id) return <></>;

  return (
    <div className="content-id-type-selector span-6">
      <CWText type="caption">Action Scope</CWText>
      <CWRadioButton
        className="radio-btn mt-8"
        value={QuestActionContentIdScope.Topic}
        label="Linked Topic"
        groupName={`contentIdScope-${defaultValues?.action}`}
        {...(defaultValues?.contentIdScope ===
          QuestActionContentIdScope.Topic && {
          checked: true,
        })}
        onChange={(e) =>
          e.target.checked &&
          onChange?.({
            contentIdentifier: '',
            contentIdScope: QuestActionContentIdScope.Topic,
          })
        }
      />
      <CWRadioButton
        className="radio-btn"
        value={QuestActionContentIdScope.Thread}
        label="Linked Thread"
        groupName={`contentIdScope-${defaultValues?.action}`}
        {...(defaultValues?.contentIdScope ===
          QuestActionContentIdScope.Thread && {
          checked: true,
        })}
        onChange={(e) =>
          e.target.checked &&
          onChange?.({
            contentIdentifier: '',
            contentIdScope: QuestActionContentIdScope.Thread,
          })
        }
      />
    </div>
  );
};

export default ActionContentIdScopeSelector;
