import React from 'react';

type FindYourTokenInputComponentProps = {
  onChangeValue: (event: any) => void;
  onkeyupValue: (event: any) => void;
};

export const FindYourTokenInputComponent = (
  props: FindYourTokenInputComponentProps
) => {
  const { onChangeValue, onkeyupValue } = props;

  return (
    <input
      autoComplete="off"
      className="p-2 flex-grow mr-2 text-xl text-gray-400 pt-3.5 focus:outline-none"
      id="token-input"
      type="text"
      placeholder="Find your favorite token"
      onInput={onChangeValue}
      onKeyUp={onkeyupValue}
    />
  );
};
