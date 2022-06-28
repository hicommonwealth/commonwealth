/* @jsx m */

import m from 'mithril';

import 'pages/login/login_avatar_and_username_input.scss';

import { Account } from 'models';
import { formatAddressShort } from 'helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { AvatarUpload } from '../../components/avatar_upload';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

type AvatarAndUsernameInputAttrs = {
  account?: Account<any>;
  address: string;
  defaultValue: string;
  onAvatarChangeHandler: (e) => void;
  onUsernameChangeHandler: (e) => void;
};

export class AvatarAndUsernameInput
  implements m.ClassComponent<AvatarAndUsernameInputAttrs>
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
      <div class="AvatarAndUsernameInput">
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
