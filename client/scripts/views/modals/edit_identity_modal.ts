import 'modals/edit_identity_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, Input, Form, FormGroup, FormLabel, Icon, Icons } from 'construct-ui';

import { IdentityInfo } from '@polkadot/types/interfaces';
import { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';

import { Account } from 'models';
import { createTXModal } from './tx_signing_modal';
import { SubstrateAccount } from '../../controllers/chain/substrate/account';
import AvatarUpload from '../components/avatar_upload';
import Substrate from '../../controllers/chain/substrate/main';
import { IdentityInfoProps } from '../../controllers/chain/substrate/identities';
import SubstrateIdentity from '../../controllers/chain/substrate/identity';

interface IAttrs {
  currentIdentity?: SubstrateIdentity;
  account: SubstrateAccount;
}

interface IState {
  error: string;
  saving: boolean;
}

const EditIdentityModal: m.Component<IAttrs, IState> = {
  oncreate: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    if (vnode.attrs.currentIdentity?.info) {
      const {
        additional,
        display,
        legal,
        web,
        riot,
        email,
        // pgpFingerprint,
        image,
        twitter
      } = vnode.attrs.currentIdentity.info;

      // do not display SHA values, only raw strings
      const d2s = (d: Data) => u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');
      $(vnode.dom).find('input[name=display]').val(d2s(display));
      $(vnode.dom).find('input[name=legal]').val(d2s(legal));
      $(vnode.dom).find('input[name=web]').val(d2s(web));
      $(vnode.dom).find('input[name=riot]').val(d2s(riot));
      $(vnode.dom).find('input[name=email]').val(d2s(email));
      // if (pgpFingerprint.isSome) {
      //   $(vnode.dom).find('input[name=pgp]').val(pgpFingerprint.unwrap().toString());
      // }
      $(vnode.dom).find('input[name=twitter]').val(d2s(twitter));
    }
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const account: SubstrateAccount = vnode.attrs.account;
    const updateIdentity = async () => {
      const data = {
        display: `${$(vnode.dom).find('input[name=display]').val()}`.trim(),
        legal: `${$(vnode.dom).find('input[name=legal]').val()}`.trim(),
        web: `${$(vnode.dom).find('input[name=web]').val()}`.trim(),
        riot: `${$(vnode.dom).find('input[name=riot]').val()}`.trim(),
        email: `${$(vnode.dom).find('input[name=email]').val()}`.trim(),
        // pgpFingerprint: `${$(vnode.dom).find('input[name=pgp]').val()}`.trim(),
        twitter: `${$(vnode.dom).find('input[name=twitter]').val()}`.trim(),
        image: null,
      };
      vnode.state.error = null;

      vnode.state.saving = true;
      if (!vnode.state.error) {
        const idData: IdentityInfoProps = {
          display: { [data.display ? 'raw' : 'none']: data.display ? data.display : null },
          email: { [data.email ? 'raw' : 'none']: data.email ? data.email : null },
          image: { [data.image ? 'sha256' : 'none']: data.image ? data.image : null },
          legal: { [data.legal ? 'raw' : 'none']: data.legal ? data.legal : null },
          riot: { [data.riot ? 'raw' : 'none']: data.riot ? data.riot : null },
          web: { [data.web ? 'raw' : 'none']: data.web ? data.web : null },
          twitter: { [data.twitter ? 'raw' : 'none']: data.twitter ? data.twitter : null },
          // pgpFingerprint: data.pgpFingerprint ? data.pgpFingerprint : null,
          additional: [],
        };

        try {
          await createTXModal((app.chain as Substrate).identities.setIdentityTx(account, idData));
        } catch (error) {
          if (typeof error === 'string') {
            vnode.state.error = error.toString();
          } else if (error.txType === 'setIdentity') {
            vnode.state.error = 'Sending transaction failed';
          } else {
            vnode.state.error = 'Unknown error';
          }
        }
        vnode.state.saving = false;
      }
      m.redraw();
    };

    const getInput = (inputLabel, inputName, description, prefixAt = false) => {
      return m(FormGroup, [
        m(FormLabel, {
          for: inputName,
        }, inputLabel),
        m(Input, {
          name: inputName,
          id: inputName,
          placeholder: description,
          autocomplete: 'off',
          contentLeft: prefixAt ? m(Icon, { name: Icons.AT_SIGN }) : null,
        }),
      ]);
    };

    return m('.EditIdentityModal', [
      m('.compact-modal-title', [
        m('h3', 'Set on-chain identity')
      ]),
      m(Form, { class: 'form' }, [
        getInput('Display Name', 'display', 'A reasonable display name for the controller of the account'),
        getInput('Legal Name', 'legal', 'Full legal name in the local jurisdiction of the entity'),
        getInput('Website', 'web', 'Website for the controller of the account, https:// automatically prepended'),
        getInput('Riot/Matrix', 'riot', 'Riot/Matrix handle held by the controller of the account'),
        getInput('Email', 'email', 'Email address of the controller of the account'),
        // getInput('PGP', 'pgp', 'PGP/GPG public key of the controller of the account'),
        getInput('Twitter', 'twitter', 'Twitter identity of the controller of the account', true),
        m('.form-bottom', [
          m('.buttons', [
            m(Button, {
              intent: 'primary',
              disabled: vnode.state.saving,
              onclick: async (e) => {
                e.preventDefault();
                await updateIdentity();
                if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
                vnode.state.saving = false;
              },
              label: 'Set Identity'
            }),
            m(Button, {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              },
              label: 'Cancel'
            }),
          ]),
          m('.clear'),
          vnode.state.error && m('.error-message', vnode.state.error),
        ])
      ])
    ]);
  }
};

export default EditIdentityModal;
