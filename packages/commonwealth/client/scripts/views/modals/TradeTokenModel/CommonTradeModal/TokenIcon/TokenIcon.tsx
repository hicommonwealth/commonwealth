import clsx from 'clsx';
import React from 'react';
import './TokenIcon.scss';

type TokenIconProps = {
  size?: 'small' | 'large';
  url: string;
};

const TokenIcon = ({ size = 'small', url }: TokenIconProps) => {
  return <img className={clsx('TokenIcon', size)} src={url} alt="token-icon" />;
};

export default TokenIcon;
