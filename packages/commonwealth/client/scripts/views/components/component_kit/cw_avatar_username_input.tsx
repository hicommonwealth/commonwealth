import React from 'react';

import { redraw } from 'mithrilInterop';

import 'components/component_kit/cw_avatar_username_input.scss';
import { formatAddressShort } from 'helpers';

import type { Account } from 'models';
import { AvatarUpload } from '../avatar_upload';
import { CWText } from './cw_text';
import { CWTextInput } from './cw_text_input';
import { getClasses } from './helpers';

type Orientation = 'horizontal' | 'vertical';

type AvatarUsernameInputProps = {
  account?: Account;
  address: string;
  darkMode?: boolean;
  value: string;
  onAvatarChangeHandler: (e) => void;
  onUsernameChangeHandler: (e) => void;
  orientation?: Orientation;
};

export const CWAvatarUsernameInput = (props: AvatarUsernameInputProps) => {
  const {
    account,
    address,
    darkMode,
    value,
    onAvatarChangeHandler,
    onUsernameChangeHandler,
    orientation = 'horizontal',
  } = props;

  return (
    <div
      className={getClasses<{ orientation?: Orientation }>(
        { orientation },
        'AvatarUsernameInput'
      )}
    >
      <AvatarUpload
        darkMode={darkMode}
        scope="user"
        size={orientation === 'vertical' ? 'large' : 'small'}
        account={account}
        uploadStartedCallback={() => {
          redraw();
        }}
        uploadCompleteCallback={(files) => {
          files.forEach((f) => {
            if (!f.uploadURL) return;
            const url = f.uploadURL.replace(/\?.*/, '');
            onAvatarChangeHandler(url.trim);
          });
          redraw();
        }}
      />
      <div className="input-and-address-container">
        <CWTextInput
          darkMode={darkMode}
          size="small"
          iconRight="write"
          value={value}
          onInput={(e) => {
            onUsernameChangeHandler((e.target as any).value);
          }}
        />
        <CWText type="caption" className="abbreviated-address">
          {formatAddressShort(address)}
        </CWText>
      </div>
    </div>
  );
};
