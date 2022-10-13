import 'modals/edit_identity_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import {
  Button,
  Input,
  Form,
  FormGroup,
  FormLabel,
  Icon,
  Icons,
} from 'construct-ui';

import { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/adapter';
import { IdentityInfoProps } from 'controllers/chain/substrate/identities';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { createTXModal } from 'views/modals/tx_signing_modal';

interface IAttrs {
  account: SubstrateAccount;
  currentIdentity?: SubstrateIdentity;
}

interface IState {
  identity: SubstrateIdentity | null;
  saving: boolean;
}

const EditIdentityModal: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    app.runWhenReady(async () => {
      vnode.state.identity = await (app.chain as Substrate).identities.load(
        vnode.attrs.account
      );
      m.redraw();
    });
  },
  oncreate: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    if (vnode.state.identity?.info) {
      const {
        additional,
        display,
        legal,
        web,
        riot,
        email,
        // pgpFingerprint,
        image,
        twitter,
      } = vnode.state.identity?.info;

      // do not display SHA values, only raw strings
      const d2s = (d: Data) =>
        u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');
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

      vnode.state.saving = true;
      const idData: IdentityInfoProps = {
        display: {
          [data.display ? 'raw' : 'none']: data.display ? data.display : null,
        },
        email: {
          [data.email ? 'raw' : 'none']: data.email ? data.email : null,
        },
        image: {
          [data.image ? 'sha256' : 'none']: data.image ? data.image : null,
        },
        legal: {
          [data.legal ? 'raw' : 'none']: data.legal ? data.legal : null,
        },
        riot: { [data.riot ? 'raw' : 'none']: data.riot ? data.riot : null },
        web: { [data.web ? 'raw' : 'none']: data.web ? data.web : null },
        twitter: {
          [data.twitter ? 'raw' : 'none']: data.twitter ? data.twitter : null,
        },
        // pgpFingerprint: data.pgpFingerprint ? data.pgpFingerprint : null,
        additional: [],
      };

      try {
        await createTXModal(
          (app.chain as Substrate).identities.setIdentityTx(
            app.user.activeAccount as SubstrateAccount,
            idData
          )
        );
      } catch (error) {
        if (typeof error === 'string') {
          notifyError(error);
        } else if (error.txType === 'setIdentity') {
          notifyError('Sending transaction failed');
        } else {
          notifyError('Unknown error');
        }
      }

      // force creation and update of the user's on-chain identity, guaranteeing that the identity
      // component has immediate access to the new identity.
      await (app.chain as Substrate).identities.load(
        app.user.activeAccount as SubstrateAccount
      );

      // temporarily mark the user's profile as invalid, since they've potentially updated their
      // display name. this ensures that any identity display will fall back to the loaded identity.
      const profile = app.profiles.getProfile(
        app.chain.id,
        app.user.activeAccount.address
      );
      if (profile) {
        profile.invalidateName();
      }
      vnode.state.saving = false;
      m.redraw();
    };

    const getInput = (inputLabel, inputName, description, prefixAt = false) => {
      return m(FormGroup, [
        m(
          FormLabel,
          {
            for: inputName,
          },
          inputLabel
        ),
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
      m('.compact-modal-title', [m('h3', 'Set on-chain identity')]),
      m(Form, { class: 'form' }, [
        getInput(
          'Display Name',
          'display',
          'A reasonable display name for the controller of the account'
        ),
        getInput(
          'Legal Name',
          'legal',
          'Full legal name in the local jurisdiction of the entity'
        ),
        getInput(
          'Website',
          'web',
          'Website for the controller of the account, https:// automatically prepended'
        ),
        getInput(
          'Riot/Matrix',
          'riot',
          'Riot/Matrix handle held by the controller of the account'
        ),
        getInput(
          'Email',
          'email',
          'Email address of the controller of the account'
        ),
        // getInput('PGP', 'pgp', 'PGP/GPG public key of the controller of the account'),
        getInput(
          'Twitter',
          'twitter',
          'Twitter identity of the controller of the account',
          true
        ),
        m('.form-bottom', [
          m('.buttons', [
            m(Button, {
              intent: 'primary',
              disabled: vnode.state.saving || !app.chain?.loaded,
              rounded: true,
              onclick: (e) => {
                e.preventDefault();
                updateIdentity().then(() => $(vnode.dom).trigger('modalexit'));
              },
              label: 'Set identity',
            }),
            m(Button, {
              rounded: true,
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              },
              label: 'Cancel',
            }),
          ]),
          m('.clear'),
        ]),
      ]),
    ]);
  },
};

export default EditIdentityModal;
