// SimpleButton.js
import React from 'react';
import { ButtonUnstyled } from '@mui/base';

import 'components/component_kit/new_button.scss';


const NewButton = ({ children, color, onClick, disabled }) => {
  return (
    <ButtonUnstyled
      color={color || 'primary'}
      onClick={onClick}
      disabled={disabled || false}
      className='NewButton'
    >
      {children}
    </ButtonUnstyled>
  );
};

export default NewButton;