import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWButton } from '../../../../../components/component_kit/new_designs/CWButton';
import './SMSForm.scss';
type SMSFormProps = {
  onCancel: () => void;
  onSubmit: (values: { SMS: string }) => void;
  isLoading?: boolean;
};

const SMSForm = ({ onSubmit, onCancel, isLoading }: SMSFormProps) => {
  const [phone, setPhone] = useState('');

  return (
    <>
      {isLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            country="us"
            enableSearch
            dropdownClass="dropDown"
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
              type="button"
              buttonWidth="wide"
              buttonType="primary"
              label="Sign in with Magic"
              disabled={isLoading}
              onClick={() => onSubmit({ SMS: phone })}
            />
          </div>
        </>
      )}
    </>
  );
};

export { SMSForm };
