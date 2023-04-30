import React from 'react';
import PropTypes from 'prop-types';

export const Input = ({ label, name, placeholder, size, ...props }) => {
  return (
    <input
      type="text"
      label={label}
      name={name}
      placeholder={placeholder}
      size={size}
      {...props}
    />
  );
};

Input.propTypes = {
  // autoComplete: PropTypes.string,
  // autoFocus: PropTypes.bool,
  // containerClassName: PropTypes.string,
  // defaultValue: PropTypes.string | PropTypes.number,
  // value: string | PropTypes.number,
  // iconRight: IconName,
  // iconRightonClick: () => void,
  // inputValidationFn: (value: string) => [ValidationStatus, string] | [],
  label: PropTypes.string,
  // maxLength: PropTypes.number,
  name: PropTypes.string,
  // onInput: (e) => void,
  // onenterkey: (e) => void,
  // onClick: (e) => void,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(['large', 'small']),
  // tabIndex: PropTypes.number,
  // manualStatusMessage: PropTypes.string,
  // manualValidationStatus: ValidationStatus,
};

Input.defaultProps = {
  //   autoComplete: 'off',
  //   autoFocus: null,
  //   containerClassName: null,
  //   darkMode: null,
  //   defaultValue: null,
  //   value: null,
  disabled: false,
  //   iconRight: null,
  //   iconRightonClick: null,
  //   inputClassName: null,
  //   inputValidationFn: null,
  //   label: null,
  //   maxLength: null,
  //   name: null,
  //   onInput: null,
  //   onenterkey: null,
  //   onClick: null,
  //   placeholder: null,
  size: 'large',
  //   tabIndex: null,
  //   displayOnly: null,
  //   manualStatusMessage: '',
  //   manualValidationStatus: '',
};
