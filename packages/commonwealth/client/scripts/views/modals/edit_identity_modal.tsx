import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';
import $ from 'jquery';
import type { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';
import { notifyError } from 'controllers/app/notifications';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { IdentityInfoProps } from 'controllers/chain/substrate/identities';
import type SubstrateIdentity from 'controllers/chain/substrate/identity';

import 'modals/edit_identity_modal.scss';

import app from 'state';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { CWButton } from '../components/component_kit/cw_button';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWTextInput } from '../components/component_kit/cw_text_input';

type EditIdentityModalAttrs = {
  account: SubstrateAccount;
  currentIdentity: SubstrateIdentity;
};

export class EditIdentityModal extends ClassComponent<EditIdentityModalAttrs> {
  private display: string;
  private email: string;
  private legal: string;
  private riot: string;
  private twitter: string;
  private web: string;
  private identity: SubstrateIdentity | null;
  private saving: boolean;

  oninit(vnode: ResultNode<EditIdentityModalAttrs>) {
    app.runWhenReady(async () => {
      this.identity = await (app.chain as Substrate).identities.load(
        vnode.attrs.account
      );

      redraw();
    });
  }

  oncreate() {
    if (this.identity?.info) {
      const { display, legal, web, riot, email, twitter } = this.identity?.info;

      // do not display SHA values, only raw strings
      const d2s = (d: Data) =>
        u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');

      this.display = d2s(display);
      this.email = d2s(email);
      this.legal = d2s(legal);
      this.riot = d2s(riot);
      this.twitter = d2s(twitter);
      this.web = d2s(web);
    }
  }

  view(vnode: ResultNode<EditIdentityModalAttrs>) {
    const updateIdentity = async () => {
      const data = {
        display: this.display.trim(),
        legal: this.legal.trim(),
        web: this.web.trim(),
        riot: this.riot.trim(),
        email: this.email.trim(),
        twitter: this.twitter.trim(),
        image: null,
      };

      this.saving = true;

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

      this.saving = false;

      redraw();
    };

    return (
      <div className="EditIdentityModal">
        <div className="compact-modal-title">
          <h3>Set on-chain identity</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWTextInput
            label="Display Name"
            placeholder="A reasonable display name for the controller of the account"
            onInput={(e) => {
              this.display = e.target.value;
            }}
          />
          <CWTextInput
            label="Legal Name"
            placeholder="Full legal name in the local jurisdiction of the entity"
            onInput={(e) => {
              this.legal = e.target.value;
            }}
          />
          <CWTextInput
            label="Website"
            placeholder="Website for the controller of the account, https:// automatically prepended"
            onInput={(e) => {
              this.web = e.target.value;
            }}
          />
          <CWTextInput
            label="Riot/Matrix"
            placeholder="Riot/Matrix handle held by the controller of the account"
            onInput={(e) => {
              this.riot = e.target.value;
            }}
          />
          <CWTextInput
            label="Email"
            placeholder="Email address of the controller of the account"
            onInput={(e) => {
              this.email = e.target.value;
            }}
          />
          <CWTextInput
            label="Twitter"
            placeholder="Twitter identity of the controller of the account"
            onInput={(e) => {
              this.twitter = e.target.value;
            }}
          />
          <div className="buttons-row">
            <CWButton
              buttonType="secondary-blue"
              onClick={(e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              }}
              label="Cancel"
            />
            <CWButton
              disabled={this.saving || !app.chain?.loaded}
              onClick={(e) => {
                e.preventDefault();
                updateIdentity().then(() => $(vnode.dom).trigger('modalexit'));
              }}
              label="Set identity"
            />
          </div>
        </div>
      </div>
    );
  }
}
