import { notifyError, notifySuccess } from 'controllers/app/notifications';
import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import { useTriggerNotificationsWorkflowMutation } from 'state/api/superAdmin';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';

const TriggerNotificationsWorkflow = () => {
  const [workflowKey, setWorkflowKey] = useState<string>('');
  const [workflowData, setWorkflowData] = useState<Record<string, unknown>>({});
  const [inputsValidated, setInputsValidated] = useState<boolean>(false);

  const onKeyInput = (e) => {
    setWorkflowKey(e.target.value);
    setInputsValidated(true);
  };

  const onDataInput = (e) => {
    setWorkflowData(e.target.value);
  };

  const dataValidationFn = (value: string): [ValidationStatus, string] | [] => {
    try {
      JSON.parse(value);
      if (workflowKey !== '') setInputsValidated(true);
      return [];
    } catch (e) {
      setInputsValidated(false);
      return ['failure', 'Invalid JSON'];
    }
  };

  const { mutateAsync: triggerNotificationsWorkflow } =
    useTriggerNotificationsWorkflowMutation();

  const onTrigger = () => {
    openConfirmation({
      title: `Trigger Workflow`,
      description:
        `Are you sure you want to trigger the ${workflowKey} ` +
        `workflow? This could cost several hundred dollars depending on the ` +
        `number of subscribed users. Run a test using the input data from ` +
        `the Knock dashboard to ensure the notification looks correct!`,
      buttons: [
        {
          label: 'Trigger',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              const result = await triggerNotificationsWorkflow({
                workflow_key: workflowKey,
                data: workflowData,
              });
              notifySuccess(
                `Workflow triggered for ${result.numSucceeded} users`,
              );
              if (result.numFailed > 0)
                notifyError(
                  `Failed to trigger workflow for ${result.numFailed} users`,
                );
            } catch (e) {
              console.error(e);
              notifyError('Failed to trigger workflow');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Trigger Notifications Workflow</CWText>
      <CWText type="caption">
        Triggers the given Knock workflow for ALL Common users. WARNING: could
        cost hundreds of dollars if every single Common user receives a
        notification
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={workflowKey}
          onInput={onKeyInput}
          placeholder="Enter a Knock workflow key"
        />
      </div>
      <div className="TaskRow">
        <CWTextInput
          value={JSON.stringify(workflowData)}
          onInput={onDataInput}
          inputValidationFn={dataValidationFn}
          placeholder="Enter valid JSON data for triggering your workflow"
        />
      </div>
      <div className="TaskRow">
        <CWButton
          label="Trigger"
          className="TaskButton"
          disabled={!inputsValidated}
          onClick={onTrigger}
        />
      </div>
    </div>
  );
};

export default TriggerNotificationsWorkflow;
