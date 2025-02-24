import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'node_modules/zod';
import React from 'react';
import { useUpdateResourceTimestamps } from 'state/api/superAdmin';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './AdminPanel.scss';

const validationSchema = z
  .object({
    resource_id: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.INVALID_INPUT })
      .nonempty({ message: VALIDATION_MESSAGES.INVALID_INPUT })
      .or(z.number({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })),
    resource_name: z.object(
      {
        value: z.enum(['Quests']),
        label: z.string(),
      },
      {
        invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        required_error: VALIDATION_MESSAGES.NO_INPUT,
      },
    ),
    date_field_name: z.object(
      {
        value: z.enum([
          'start_date',
          'end_date',
          'created_at',
          'updated_at',
          'deleted_at',
        ]),
        label: z.string(),
      },
      {
        invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        required_error: VALIDATION_MESSAGES.NO_INPUT,
      },
    ), // add more date fields as required
    date_field_value: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.INVALID_INPUT })
      .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  })
  .refine(
    (data) => {
      if (
        data.resource_name.value === 'Quests' &&
        typeof data.resource_id !== 'number' &&
        typeof parseInt(data.resource_id) !== 'number'
      ) {
        return false;
      }
      return true;
    },
    {
      path: ['resource_id'],
      message: `For resource_name=Quests, resource_id must be a number`,
    },
  )
  .refine(
    (data) => {
      if (
        data.resource_name.value === 'Quests' &&
        !['start_date', 'end_date', 'created_at', 'updated_at'].includes(
          data.date_field_name.value,
        )
      ) {
        return false;
      }
      return true;
    },
    {
      path: ['date_field_name'],
      message: `For resource_name=Quests, date_field_name must be either 'start_date' or 'end_date'`,
    },
  );

const ChangeResourceTimestamps = () => {
  const { mutateAsync: updateResourceTimestamps, isLoading } =
    useUpdateResourceTimestamps();

  const resourceNames = ['Quests'].map((x) => ({
    label: x,
    value: x,
  }));
  const dateFieldNames = [
    'created_at',
    'updated_at',
    'start_date',
    'end_date',
  ].map((x) => ({
    label: x,
    value: x,
  }));

  const handleSubmit = (values: z.infer<typeof validationSchema>) => {
    const handleAsync = async () => {
      try {
        const response = await updateResourceTimestamps({
          date_field_name: values.date_field_name.value,
          resource_name: values.resource_name.value,
          date_field_value: values.date_field_value,
          resource_id: ['Quests'].includes(values.resource_name.value)
            ? parseInt(`${values.resource_id}`)
            : values.resource_id,
        });
        if (response.success) {
          notifySuccess('Updated resource timestamp');
        } else {
          notifyError(
            'Failed to update resource timestamp, please ensure resource id is valid',
          );
        }
      } catch (error) {
        console.log('Failed to update resource timestamp: ', error);
        notifyError('Failed to update resource timestamp');
      }
    };
    handleAsync().catch(console.error);
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update resource timestamps</CWText>
      <CWText type="b2">
        Update timestamps and more dates for resources on common.
      </CWText>
      <CWText type="b2" className="danger" fontWeight="bold">
        Important: this is a dangerous action and should be avoided in
        production environments.
      </CWText>
      <CWForm
        className="TaskRow ResourceTimestampsUpdateForm"
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <CWTextInput
          label="Resource id"
          hookToForm
          name="resource_id"
          placeholder="Enter resource id"
          fullWidth
        />
        <CWSelectList
          name="resource_name"
          hookToForm
          isClearable={false}
          label="Select resource name"
          placeholder="Select resource name"
          options={resourceNames}
        />
        <CWSelectList
          name="date_field_name"
          hookToForm
          isClearable={false}
          label="Select timestamp field"
          placeholder="Select timestamp field"
          options={dateFieldNames}
        />
        <CWDateTimeInput
          label="New timestamp value"
          hookToForm
          name="date_field_value"
          fullWidth
        />
        <CWButton
          label="Submit"
          type="submit"
          disabled={isLoading}
          buttonWidth="wide"
        />
      </CWForm>
    </div>
  );
};

export default ChangeResourceTimestamps;
