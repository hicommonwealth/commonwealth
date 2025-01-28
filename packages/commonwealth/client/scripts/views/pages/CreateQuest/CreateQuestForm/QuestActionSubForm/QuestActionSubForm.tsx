import { QuestEvents } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './QuestActionSubForm.scss';
import { QuestAction, QuestActionSubFormProps } from './types';

const QuestActionSubForm = ({
  isRemoveable = true,
  onRemove,
  errors,
  defaultValues,
  onChange,
  hiddenActions,
}: QuestActionSubFormProps) => {
  const actionOptions = Object.keys(QuestEvents)
    .map((event) => ({
      value: event as QuestAction,
      label: splitCamelOrPascalCase(event),
    }))
    .filter((action) => !(hiddenActions || []).includes(action.value));

  return (
    <div className={clsx('QuestActionSubForm', { isRemoveable })}>
      {isRemoveable && (
        <CWIconButton
          iconName="close"
          onClick={onRemove}
          className="ml-auto cursor-pointer remove-btn"
        />
      )}

      <CWSelectList
        isClearable={false}
        label="Action"
        placeholder="Select an action"
        name="action"
        options={actionOptions}
        onChange={(newValue) =>
          newValue && onChange?.({ action: newValue.value })
        }
        {...(defaultValues?.action && {
          defaultValue: actionOptions.find(
            (a) => a.value === defaultValues.action,
          ),
        })}
        customError={errors?.action}
      />

      <CWTextInput
        label="Relevant Quest Link (optional)"
        name="questLink"
        placeholder="https://example.com"
        instructionalMessage="Note: Social media task links will appear here (e.g., follow on X, join Discord)"
        fullWidth
        {...(defaultValues?.questLink && {
          defaultValue: defaultValues?.questLink,
        })}
        onInput={(e) => onChange?.({ questLink: e?.target?.value?.trim() })}
        customError={errors?.questLink}
      />
    </div>
  );
};

export default QuestActionSubForm;
