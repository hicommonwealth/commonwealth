import { CWForm } from 'client/scripts/views/components/component_kit/new_designs/CWForm';
import { CWPhoneInput } from 'client/scripts/views/components/component_kit/new_designs/CWPhoneInput/CWPhoneInput';
import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWButton } from '../../../../../components/component_kit/new_designs/CWButton';
import './SMSForm.scss';
import { SMSValidationSchema } from './validation';
type SMSFormProps = {
  onCancel: () => void;
  onSubmit: (values: { SMS: string }) => void;
  isLoading?: boolean;
};

const SMSForm = ({ onSubmit, onCancel, isLoading }: SMSFormProps) => {
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);
  function handleWatchForm({ SMS }) {
    if (SMS.length >= 10) {
      setIsPhoneNumberValid(true);
    } else {
      setIsPhoneNumberValid(false);
    }
  }
  const onSubmitForm = ({ SMS }) => {
    onSubmit({ SMS: `+${SMS}` });
  };

  return (
    <CWForm
      validationSchema={SMSValidationSchema}
      onSubmit={onSubmitForm}
      onWatch={handleWatchForm}
    >
      {isLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <div className="dropdown-wrapper">
            <CWPhoneInput
              hookToForm
              name="SMS"
              label="Phone Number"
              country="us"
              disabled={isLoading}
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
                disabled={isLoading || !isPhoneNumberValid}
              />
            </div>
          </div>
        </>
      )}
    </CWForm>
  );
};

export { SMSForm };
