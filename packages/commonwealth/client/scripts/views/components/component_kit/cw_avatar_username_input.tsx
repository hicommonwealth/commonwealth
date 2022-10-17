/* @jsx m */

import m from 'mithril';

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

export class CWAvatarUsernameInput
  implements m.ClassComponent<AvatarUsernameInputAttrs>
{
  view(vnode) {
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
        class={getClasses<{ orientation?: Orientation }>(
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
            m.redraw();
          }}
          uploadCompleteCallback={(files) => {
            files.forEach((f) => {
              if (!f.uploadURL) return;
              const url = f.uploadURL.replace(/\?.*/, '');
              onAvatarChangeHandler(url.trim);
            });
            m.redraw();
          }}
        />
        <div class="input-and-address-container">
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
