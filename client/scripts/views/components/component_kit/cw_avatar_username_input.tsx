/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_avatar_username_input.scss';

import { Account } from 'models';
import { formatAddressShort } from 'helpers';
import { CWText } from './cw_text';
import { AvatarUpload } from '../avatar_upload';
import { CWTextInput } from './cw_text_input';

type AvatarUsernameInputAttrs = {
  account?: Account<any>;
  address: string;
  defaultValue: string;
  onAvatarChangeHandler: (e) => void;
  onUsernameChangeHandler: (e) => void;
};

export class CWAvatarUsernameInput
  implements m.ClassComponent<AvatarUsernameInputAttrs>
{
  view(vnode) {
    const {
      account,
      address,
      defaultValue,
      onAvatarChangeHandler,
      onUsernameChangeHandler,
    } = vnode.attrs;

    return (
      <div class="AvatarUsernameInput">
        <AvatarUpload
          scope="user"
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
            size="small"
            iconRight="edit"
            containerClassName="username-input-container"
            defaultValue={defaultValue}
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
