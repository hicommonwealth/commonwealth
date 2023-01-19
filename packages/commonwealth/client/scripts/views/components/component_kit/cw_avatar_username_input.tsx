/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_avatar_username_input.scss';

import { Account } from 'models';
import { formatAddressShort } from 'helpers';
import { CWText } from './cw_text';
import { AvatarUpload } from '../avatar_upload';
import { CWTextInput } from './cw_text_input';
import { getClasses } from './helpers';

type Orientation = 'horizontal' | 'vertical';

type AvatarUsernameInputAttrs = {
  account?: Account;
  address: string;
  darkMode?: boolean;
  value: string;
  onAvatarChangeHandler: (e) => void;
  onUsernameChangeHandler: (e) => void;
  orientation?: Orientation;
};

export class CWAvatarUsernameInput extends ClassComponent<AvatarUsernameInputAttrs> {
  view(vnode: ResultNode<AvatarUsernameInputAttrs>) {
    const {
      account,
      address,
      darkMode,
      value,
      onAvatarChangeHandler,
      onUsernameChangeHandler,
      orientation = 'horizontal',
    } = vnode.attrs;

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
            this.redraw();
          }}
          uploadCompleteCallback={(files) => {
            files.forEach((f) => {
              if (!f.uploadURL) return;
              const url = f.uploadURL.replace(/\?.*/, '');
              onAvatarChangeHandler(url.trim);
            });
            this.redraw();
          }}
        />
        <div className="input-and-address-container">
          <CWTextInput
            darkMode={darkMode}
            size="small"
            iconRight="write"
            value={value}
            oninput={(e) => {
              onUsernameChangeHandler((e.target as any).value);
            }}
          />
          <CWText type="caption" className="abbreviated-address">
            {formatAddressShort(address)}
          </CWText>
        </div>
      </div>
    );
  }
}
