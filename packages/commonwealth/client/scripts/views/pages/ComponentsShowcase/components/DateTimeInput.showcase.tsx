import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import React from 'react';
import { CWDateTimeInput } from 'views/components/component_kit/CWDateTimeInput';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { z } from 'zod';

export const validation = z.object({
  date: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
});

const CWDateTimeInputShowCase = () => {
  return (
    <>
      <CWText type="h5">DateTime picker (default)</CWText>
      <div className="flex-row">
        <CWDateTimeInput />
      </div>
      <CWText type="h5">DateTime picker fullwidth</CWText>
      <div className="flex-row">
        <CWDateTimeInput fullWidth />
      </div>
      <CWText type="h5">DateTime picker with label</CWText>
      <div className="flex-row">
        <CWDateTimeInput fullWidth label="Start Date" />
      </div>
      <CWText type="h5">DateTime picker with validation</CWText>
      <div className="flex-row">
        <CWForm
          validationSchema={validation}
          onSubmit={console.log}
          onErrors={console.error}
        >
          <CWDateTimeInput name="date" hookToForm />
          <CWButton label="Submit" type="submit" />
        </CWForm>
      </div>

      <CWText type="h5">DateTime picker with min/max dates</CWText>
      <div className="flex-row">
        <CWDateTimeInput
          selected={new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)}
          minDate={new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)}
          maxDate={new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)}
        />
      </div>
    </>
  );
};

export default CWDateTimeInputShowCase;
