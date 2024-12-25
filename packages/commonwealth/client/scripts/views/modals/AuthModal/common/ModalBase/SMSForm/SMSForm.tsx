import React from 'react';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWButton } from '../../../../../components/component_kit/new_designs/CWButton';
import { CWForm } from '../../../../../components/component_kit/new_designs/CWForm';
import { CWTextInput } from '../../../../../components/component_kit/new_designs/CWTextInput';
import './SMSForm.scss';
import { SMSValidationSchema } from './validation';

type SMSFormProps = {
  onCancel: () => void;
  onSubmit: (values: { SMS: string }) => void;
  isLoading?: boolean;
};

const SMSForm = ({ onSubmit, onCancel, isLoading }: SMSFormProps) => {
  return (
    <CWForm
      className="SMSForm"
      validationSchema={SMSValidationSchema}
      onSubmit={!isLoading ? onSubmit : () => {}}
    >
      {isLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <CWTextInput
            fullWidth
            hookToForm
            name="SMS"
            label="Phone number"
            placeholder="Phone number"
          />
          <div className="action-btns">
            <CWButton
              type="button"
              onClick={onCancel}
              buttonType="tertiary"
              label="Back to sign in options"
              disabled={isLoading}
            />
            <CWButton
              type="submit"
              buttonWidth="wide"
              buttonType="primary"
              label="Sign in with Magic"
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </CWForm>
  );
};

export { SMSForm };
