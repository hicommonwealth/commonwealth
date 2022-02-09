/* @jsx m */

import m from 'mithril';

// import app from 'state';
import {
  InputPropertyRow,
  //   SelectPropertyRow,
} from 'views/components/metadata_rows_test';
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

export const initChainForm = (): ChainFormState => {
  return {
    icon_url: '',
    website: '',
    discord: '',
    element: '',
    telegram: '',
    github: '',
    description: '',
    uploadInProgress: false,
  };
};

export function defaultChainRows<T extends ChainFormState>(
  state: T,
  disabled = false
) {
  return [
    <InputPropertyRow
      title="Description"
      disabled={disabled}
      defaultValue={state.description}
      onChangeHandler={(v) => {
        state.description = v;
      }}
      textarea={true}
    />,
    <tr class="AvatarUploadRow">
      <td>Upload Icon</td>
      <td>
        {m(AvatarUpload, {
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
        })}
      </td>
    </tr>,
    <InputPropertyRow
      title="Icon URL"
      disabled={disabled}
      defaultValue={state.icon_url}
      placeholder="https://"
      onChangeHandler={(v) => {
        state.icon_url = v;
      }}
    />,
    <InputPropertyRow
      title="Website"
      disabled={disabled}
      defaultValue={state.website}
      placeholder="https://example.com"
      onChangeHandler={(v) => {
        state.website = v;
      }}
    />,
    <InputPropertyRow
      title="Discord"
      disabled={disabled}
      defaultValue={state.discord}
      placeholder="https://discord.com/invite"
      onChangeHandler={(v) => {
        state.discord = v;
      }}
    />,
    <InputPropertyRow
      title="Element"
      disabled={disabled}
      defaultValue={state.element}
      placeholder="https://matrix.to/#"
      onChangeHandler={(v) => {
        state.element = v;
      }}
    />,
    <InputPropertyRow
      title="Telegram"
      disabled={disabled}
      defaultValue={state.telegram}
      placeholder="https://t.me"
      onChangeHandler={(v) => {
        state.telegram = v;
      }}
    />,
    <InputPropertyRow
      title="Github"
      disabled={disabled}
      defaultValue={state.github}
      placeholder="https://github.com"
      onChangeHandler={(v) => {
        state.github = v;
      }}
    />,
  ];
}

// export interface EthChainAttrs {
//   ethChains: { [id: number]: { url: string; alt_wallet_url: string } };
//   ethChainNames: { [id: number]: string };
// }

// export interface EthFormState extends ChainFormState {
//   chain_string: string;
//   chain_id: string;
//   url: string;
//   alt_wallet_url: string;
//   address: string;
//   loaded: boolean;
// }

// export function ethChainRows<
//   Attrs extends EthChainAttrs,
//   State extends EthFormState
// >(attrs: Attrs, state: State) {
//   const addlChainStrings = app?.user.isSiteAdmin ? ['Custom'] : [];
//   return [
//     m(SelectPropertyRow, {
//       title: 'Chain',
//       options: [
//         ...Object.keys(attrs.ethChains).map(
//           (c) => attrs.ethChainNames[c] || `${c}`
//         ),
//         ...addlChainStrings,
//       ],
//       value: state.chain_string,
//       onchange: (value) => {
//         state.chain_string = value;
//         if (value !== 'Custom') {
//           const [id] =
//             Object.entries(attrs.ethChainNames).find(
//               ([, name]) => name === value
//             ) || Object.keys(attrs.ethChains).find((cId) => `${cId}` === value);
//           state.chain_id = id;
//           state.url = attrs.ethChains[id].url;
//           state.alt_wallet_url = attrs.ethChains[id].alt_wallet_url;
//         } else {
//           state.chain_id = '';
//           state.url = '';
//           state.alt_wallet_url = '';
//         }
//         state.loaded = false;
//       },
//     }),
//     state.chain_string === 'Custom' &&
//       m(InputPropertyRow, {
//         title: 'Chain ID',
//         defaultValue: state.chain_id,
//         placeholder: '1',
//         onChangeHandler: async (v) => {
//           state.chain_id = v;
//           state.loaded = false;
//         },
//       }),
//     state.chain_string === 'Custom' &&
//       m(InputPropertyRow, {
//         title: 'Websocket URL',
//         defaultValue: state.url,
//         placeholder: 'wss://... (leave empty for default)',
//         onChangeHandler: async (v) => {
//           state.url = v;
//           state.loaded = false;
//         },
//       }),
//     state.chain_string === 'Custom' &&
//       m(InputPropertyRow, {
//         title: 'HTTP URL',
//         defaultValue: state.alt_wallet_url,
//         placeholder: 'https://...  (leave empty for default)',
//         onChangeHandler: async (v) => {
//           state.alt_wallet_url = v;
//           state.loaded = false;
//         },
//       }),
//     m(InputPropertyRow, {
//       title: 'Address',
//       defaultValue: state.address,
//       placeholder: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
//       onChangeHandler: (v) => {
//         state.address = v;
//         state.loaded = false;
//       },
//     }),
//   ];
// }
