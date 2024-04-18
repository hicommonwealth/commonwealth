import { CWCustomIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_custom_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import clsx from 'clsx';
import React from 'react';
import './Option.scss';

const OPTION_COPY = {
  'existing-wallet': {
    title: 'I have a wallet',
    description: 'Connect with MetaMask, Keplr, etc.',
    moreInfo: {
      content: 'Recommended',
      isHighlighted: true,
    },
  },
  'new-wallet': {
    title: 'Create a wallet for me',
    description: 'Using email or social login',
    moreInfo: {
      content: (
        <>
          Powered by Magic Link
          <CWCustomIcon iconName="magic" />
        </>
      ),
      isHighlighted: false,
    },
  },
};

type OptionProps = {
  type: 'existing-wallet' | 'new-wallet';
  onClick: () => any;
};

const Option = ({ type, onClick }: OptionProps) => {
  const copy = OPTION_COPY[type];

  return (
    <button className={clsx('Option')} onClick={onClick}>
      <div className="left-section">
        <CWText type="h5">{copy.title}</CWText>
        <CWText type="b1">{copy.description}</CWText>
      </div>
      <CWText
        type="caption"
        className={clsx('right-section', {
          isHighlighted: copy.moreInfo.isHighlighted,
        })}
      >
        {copy.moreInfo.content}
      </CWText>
    </button>
  );
};

export { Option };
