import React from "react";

import { ValidationStatus } from "../../cw_validation_text";

export const useTextInputWithValidation = () => {
  const [inputTimeout, setInputTimeout] = React.useState<
    NodeJS.Timeout | undefined
  >();
  const [statusMessage, setStatusMessage] = React.useState<
    string | undefined
  >();
  const [validationStatus, setValidationStatus] = React.useState<
    ValidationStatus | undefined
  >();

  return {
    inputTimeout,
    setInputTimeout,
    statusMessage,
    setStatusMessage,
    validationStatus,
    setValidationStatus,
  };
};
