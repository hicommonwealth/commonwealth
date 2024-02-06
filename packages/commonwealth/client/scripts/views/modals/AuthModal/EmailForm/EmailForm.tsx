import React from 'react';
import CWLoadingSpinner from 'views/components/component_kit/new_designs/CWLoadingSpinner';
import { CWForm } from '../../../components/component_kit/new_designs/CWForm';
import { CWTextInput } from '../../../components/component_kit/new_designs/CWTextInput';
import { CWButton } from '../../../components/component_kit/new_designs/cw_button';
import './EmailForm.scss';
import { emailValidationSchema } from './validation';

type EmailFormProps = {
  onCancel: () => any;
  onSubmit: (values: { email: string }) => any;
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
        <CWLoadingSpinner />
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
              label="Sign in with Magic"
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </CWForm>
  );
};

export { EmailForm };
