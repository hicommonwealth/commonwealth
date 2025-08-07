import React from 'react';
import { useFormContext } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './CWPhoneInput.scss';
type CWPhoneInputProps = {
  name: string;
  label?: string;
  country?: string;
  disabled?: boolean;
  hookToForm?: boolean;
};

const CWPhoneInput = ({
  name,
  country = 'us',
  disabled,
  hookToForm,
}: CWPhoneInputProps) => {
  const formContext = useFormContext();
  const isHookedToForm = hookToForm && name;
  const formFieldContext = isHookedToForm ? formContext.register(name) : null;

  return (
    <div className="CWPhoneInput">
      <PhoneInput
        {...formFieldContext}
        country={country}
        disabled={disabled}
        onChange={(value) => formContext.setValue(name, value)}
        inputClass="input-container"
        dropdownClass="dropDown"
        containerClass="dropdown-options-display"
      />
    </div>
  );
};

export { CWPhoneInput };
