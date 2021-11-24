import m from 'mithril';
import {
  InputPropertyRow
} from 'views/components/metadata_rows';
import AvatarUpload, { AvatarScope } from 'views/components/avatar_upload';


export interface ChainFormState {
  description: string;
  icon_url: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  uploadInProgress: boolean;
}

export function initChainForm<T extends ChainFormState>(state: T) {
  state.icon_url = '';
  state.website = '';
  state.discord = '';
  state.element = '';
  state.telegram = '';
  state.github = '';
  state.description = '';
  state.uploadInProgress = false;
}

export function defaultChainRows<T extends ChainFormState>(state: T, disabled = false) {
  return [
    m(InputPropertyRow, {
      title: 'Description',
      disabled,
      defaultValue: state.description,
      onChangeHandler: (v) => {
        state.description = v;
      },
      textarea: true,
    }),
    m('tr.AvatarUploadRow', [
      m('td', 'Upload Icon'),
      m('td', [
        m(AvatarUpload, {
          avatarScope: AvatarScope.Chain,
          uploadStartedCallback: () => {
            state.uploadInProgress = true;
            m.redraw();
          },
          uploadCompleteCallback: (files) => {
            files.forEach((f) => {
              if (!f.uploadURL) return;
              const url = f.uploadURL.replace(/\?.*/, '');
              state.icon_url = url;
            });
            state.uploadInProgress = false;
            m.redraw();
          },
        }),
      ]),
    ]),
    m(InputPropertyRow, {
      title: 'Icon URL',
      disabled,
      defaultValue: state.icon_url,
      placeholder: 'https://',
      onChangeHandler: (v) => {
        state.icon_url = v;
      },
    }),
    m(InputPropertyRow, {
      title: 'Website',
      disabled,
      defaultValue: state.website,
      placeholder: 'https://example.com',
      onChangeHandler: (v) => {
        state.website = v;
      },
    }),
    m(InputPropertyRow, {
      title: 'Discord',
      disabled,
      defaultValue: state.discord,
      placeholder: 'https://discord.com/invite',
      onChangeHandler: (v) => {
        state.discord = v;
      },
    }),
    m(InputPropertyRow, {
      title: 'Element',
      disabled,
      defaultValue: state.element,
      placeholder: 'https://matrix.to/#',
      onChangeHandler: (v) => {
        state.element = v;
      },
    }),
    m(InputPropertyRow, {
      title: 'Telegram',
      disabled,
      defaultValue: state.telegram,
      placeholder: 'https://t.me',
      onChangeHandler: (v) => {
        state.telegram = v;
      },
    }),
    m(InputPropertyRow, {
      title: 'Github',
      disabled,
      defaultValue: state.github,
      placeholder: 'https://github.com',
      onChangeHandler: (v) => {
        state.github = v;
      },
    }),
  ];
}
