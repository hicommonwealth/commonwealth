/* @jsx m */

import type { ISubmittableResult } from '@polkadot/types/types';
import { formatCoin } from 'adapters/currency';
import ClassComponent from 'class_component';
import type Substrate from 'controllers/chain/substrate/adapter';
import { blockperiodToDuration, formatDuration } from 'helpers';
import $ from 'jquery';
import m from 'mithril';

import 'pages/admin.scss';

import app from 'state';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import User from 'views/components/widgets/user';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWButton } from '../components/component_kit/cw_button';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { PageNotFound } from './404';

class SudoForm extends ClassComponent {
  private resultText: string;
  private txProcessing: boolean;

  view() {
    const author = app.user.activeAddressAccount;
    const substrate = app.chain as Substrate;

    if (!substrate.chain.sudoKey) {
      return <CWText type="h5">No sudo key available on this chain.</CWText>;
    }

    if (author && author.address !== substrate.chain.sudoKey) {
      return (
        <div class="admin-column">
          <CWText>Must be logged into admin account to use Sudo: </CWText>
          {m(User, {
            user: app.chain.accounts.get(substrate.chain.sudoKey),
          })}
        </div>
      );
    }

    let keyring;

    try {
      // keyring = author.getKeyringPair();
      // TODO: FIXME: we do not support unlocking with seed/mnemonic, so we will need to use
      //   the signer from Polkadotjs web wallet to perform sudo actions.
    } catch (e) {
      return <CWText type="h5">Account must be unlocked to use Sudo.</CWText>;
    }

    return (
      <div class="admin-column">
        <CWText type="h5">Sudo: run function as Admin</CWText>
        {m(EdgewareFunctionPicker)}
        <CWButton
          disabled={this.txProcessing}
          onclick={(e) => {
            e.preventDefault();
            const call = EdgewareFunctionPicker.getMethod({
              module: '',
              function: '',
              args: [],
            });
            this.txProcessing = true;
            this.resultText = 'Waiting...';
            m.redraw();
            substrate.chain.api.tx.sudo
              .sudo(call)
              .signAndSend(keyring, (result: ISubmittableResult) => {
                if (result.isCompleted) {
                  this.txProcessing = false;
                  if (result.isFinalized) {
                    this.resultText = 'Action completed successfully.';
                  } else {
                    this.resultText = 'Action was unsuccessful.';
                  }
                  m.redraw();
                }
              });
          }}
          label="Submit Action"
        />
        <CWText>{this.resultText}</CWText>
      </div>
    );
  }
}

class ChainStats extends ClassComponent {
  view() {
    const substrate = app.chain as Substrate;

    const formatBlocks = (blocks) => [
      blocks,
      ' blocks - ',
      formatDuration(blockperiodToDuration(blocks)),
    ];

    return (
      <div class="admin-column">
        <CWText type="h5">ChainInfo</CWText>
        <div class="stat">
          <CWLabel label="Id" />
          <CWText>{app.activeChainId()}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Name" />
          <CWText>{app.chain.name?.toString()}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Version" />
          <CWText>{app.chain.version?.toString()}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Runtime" />
          <CWText>{app.chain.runtimeName?.toString()}</CWText>
        </div>
        <CWText type="h5">Block Production</CWText>
        <div class="stat">
          <CWLabel label="Current Block" />
          <CWText>{app.chain.block?.height}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Last Block Created" />
          <CWText>{app.chain.block?.lastTime.format('HH:mm:ss')}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Target Block Time" />
          <CWText>{app.chain.block?.duration} sec</CWText>
        </div>
        <CWText type="h5">Balances</CWText>
        <div class="stat">
          <CWLabel label="Total EDG" />
          <CWText>{formatCoin(substrate.chain.totalbalance)}</CWText>
        </div>
        <div class="stat">
          <CWLabel label="Existential Deposit" />
          <CWText>{formatCoin(substrate.chain.existentialdeposit)}</CWText>
        </div>
        <CWText type="h5">Democracy Proposals</CWText>
        <div class="stat">
          <CWLabel label="Launch Period" />
          <CWText>
            {formatBlocks(substrate.democracyProposals.launchPeriod)}
          </CWText>
        </div>
        <div class="stat">
          <CWLabel label="Minimum Deposit" />
          <CWText>
            {formatCoin(substrate.democracyProposals.minimumDeposit)}
          </CWText>
        </div>
      </div>
    );
  }
}

class AdminActions extends ClassComponent {
  private disabled: boolean;
  private error: string;
  private failure: boolean;
  private inprogress: boolean;
  private profiles: any;
  private role: string;
  private selectedProfile: string;
  private success: boolean;

  oninit() {
    const profiles = app.newProfiles.store.getAll();
    this.profiles = {};

    for (const profile in profiles) {
      if (profile) {
        this.profiles[profile] = {
          address: profiles[profile].address,
          name: profiles[profile].name,
        };
      }
    }
  }

  view() {
    let adminChoices;

    if (this.profiles) {
      adminChoices = Object.keys(this.profiles).map((key) => {
        const addr = this.profiles[key].address;
        return { label: addr, value: addr };
      });

      this.selectedProfile = adminChoices[0];
    }

    return (
      <div class="admin-column">
        <CWText type="h5">Admin</CWText>
        <CWText>Set up the chain with test proposals</CWText>
        <CWText>
          Run individual test suites (suite 1 required before 2 and 3)
        </CWText>
        <CWText>Create identities</CWText>
        <CWText type="h5">Site admin panel (unimplemented)</CWText>
        <CWDropdown
          label="Choose a possible admin"
          options={adminChoices}
          onSelect={(result) => {
            this.selectedProfile = result.value;
          }}
        />
        <CWText>
          This list contains all potential individuals to make admin.
        </CWText>
        <CWDropdown
          label="Choose a role"
          options={[
            {
              label: 'siteAdmin',
              value: 'siteAdmin',
            },
            {
              label: 'chainAdmin',
              value: 'chainAdmin',
            },
          ]}
          onSelect={(result) => {
            this.role = result.value;
          }}
        />
        <CWButton
          disabled={this.inprogress}
          onclick={(e) => {
            e.preventDefault();
            this.inprogress = true;
            // TODO: Change to PUT /adminStatus
            $.post(`${app.serverUrl()}/updateAdminStatus`, {
              admin: app.user.activeAddressAccount.address,
              address: this.selectedProfile, // the address to be changed
              role: this.role,
              jwt: app.user.jwt,
            }).then(
              (response) => {
                if (response.status === 'Success') {
                  m.redraw();
                } else {
                  // error tracking
                }
                this.inprogress = false;
              },
              (err) => {
                this.failure = true;
                this.disabled = false;
                if (err.responseJSON) this.error = err.responseJSON.error;
                m.redraw();
              }
            );
          }}
          label={
            this.inprogress ? `Adding ${this.selectedProfile}` : 'Add admin'
          }
        />
      </div>
    );
  }
}

class AdminPage extends ClassComponent {
  view() {
    if (!app.chain) {
      m.route.set('/', {}, { replace: true });
      return <PageLoading />;
    } else if (app.chain && app.user.isSiteAdmin) {
      return (
        <Sublayout>
          <div class="AdminPage">
            {app.chain ? (
              <>
                <AdminActions />
                <SudoForm />
                <ChainStats />
              </>
            ) : null}
          </div>
        </Sublayout>
      );
    } else {
      return <PageNotFound />;
    }
  }
}

export default AdminPage;
