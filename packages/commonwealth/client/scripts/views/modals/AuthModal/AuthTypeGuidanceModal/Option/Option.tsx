import clsx from 'clsx';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { AuthModalType } from '../../types';
import './Option.scss';

const CTA_COPY = {
  [AuthModalType.CreateAccount]: `Create an account`,
  [AuthModalType.SignIn]: `Sign in another way`,
};

type OptionProps = {
  type: keyof typeof CTA_COPY;
  onClick: () => void;
};

const Option = ({ type, onClick }: OptionProps) => {
  const cta = CTA_COPY[type];

  return (
    <button className={clsx('Option')} onClick={onClick}>
      <CWText type="b1">{cta}</CWText>

      <CWIcon iconName="caretRight" />
    </button>
  );
};

export { Option };
