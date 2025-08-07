import React from 'react';
import CWCircleMultiplySpinner from 'views/components/component_kit/CWCircleMultiplySpinner';
import { CWButton } from '../../../../../components/component_kit/CWButton';
import { CWForm } from '../../../../../components/component_kit/CWForm';
import { CWTextInput } from '../../../../../components/component_kit/CWTextInput';
import './EmailForm.scss';
import { emailValidationSchema } from './validation';

type EmailFormProps = {
  onCancel: () => void;
  onSubmit: (values: { email: string }) => void;
  isLoading?: boolean;
};

const EmailForm = ({ onSubmit, onCancel, isLoading }: EmailFormProps) => {
  return (
    <CWForm
      className="EmailForm"
      validationSchema={emailValidationSchema}
      onSubmit={!isLoading ? onSubmit : () => {}}
    >
      {isLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <CWTextInput
            fullWidth
            hookToForm
            name="email"
            label="Email address"
            placeholder="Email address"
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
              label="Sign In"
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </CWForm>
  );
};

export { EmailForm };
