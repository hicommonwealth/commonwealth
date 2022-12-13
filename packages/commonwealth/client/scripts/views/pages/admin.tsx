/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import ClassComponent from 'class_component';
import { ISubmittableResult } from '@polkadot/types/types';

import 'pages/admin.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { blockperiodToDuration, formatDuration } from 'helpers';
import { formatCoin } from 'adapters/currency';
import Substrate from 'controllers/chain/substrate/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import { DropdownFormField } from 'views/components/forms';
import User from 'views/components/widgets/user';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from './404';

class SudoForm extends ClassComponent {
  private resultText: string;
  private txProcessing: boolean;

  view() {
    const author = app.user.activeAccount as SubstrateAccount;
    const substrate = app.chain as Substrate;

    if (!substrate.chain.sudoKey) {
      return m(
        '.SudoForm',
        {
          style:
            'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;',
        },
        'No sudo key available on this chain.'
      );
    }

    if (author && author.address !== substrate.chain.sudoKey) {
      return m(
        '.SudoForm',
        {
          style:
            'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;',
        },
        [
          'Must be logged into admin account to use Sudo: ',
          m(User, {
            user: app.chain.accounts.get(substrate.chain.sudoKey),
          }),
        ]
      );
    }

    let keyring;

    try {
      // keyring = author.getKeyringPair();
      // TODO: FIXME: we do not support unlocking with seed/mnemonic, so we will need to use
      //   the signer from Polkadotjs web wallet to perform sudo actions.
    } catch (e) {
      return m(
        '.SudoForm',
        {
          style:
            'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;',
        },
        'Account must be unlocked to use Sudo.'
      );
    }

    return m(
      '.SudoForm',
      {
        style:
          'width: 80%; padding: 5px 24px; border: 1px solid #eee; margin-bottom: 15px;',
      },
      [
        m(
          'h2.header',
          { style: 'margin: 15px 0;' },
          'Sudo: run function as Admin'
        ),
        m(EdgewareFunctionPicker),
        m(
          'button',
          {
            type: 'submit',
            disabled: this.txProcessing,
            onclick: (e) => {
              e.preventDefault();
              const call = EdgewareFunctionPicker.getMethod();
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
            },
          },
          'Submit Action'
        ),
        m('h4.header', { style: 'margin: 15px 0;' }, this.resultText),
        m('br'),
      ]
    );
  }
}

class ChainStats extends ClassComponent {
  view() {
    const substrate = app.chain as Substrate;

    const header = (label) =>
      m('h4.header', { style: 'margin: 15px 0;' }, label);
    const stat = (label, content) =>
      m('.stat', [m('.label', label), m('.value', content)]);
    const formatBlocks = (blocks) => [
      blocks,
      ' blocks - ',
      formatDuration(blockperiodToDuration(blocks)),
    ];

    return m(
      '.ChainStats',
      {
        style:
          'padding: 5px 24px; border: 1px solid #eee; margin-bottom: 40px;',
      },
      [
        m(
          'style',
          '.ChainStats .stat > * { display: inline-block; width: 50%; }'
        ),
        header('ChainInfo'),
        stat('ChainInfo', app.activeChainId()),
        stat('ChainInfo Name', app.chain.name?.toString()),
        stat('ChainInfo Version', app.chain.version?.toString()),
        stat('ChainInfo Runtime', app.chain.runtimeName?.toString()),
        header('Block Production'),
        stat('Current block', app.chain.block?.height),
        stat(
          'Last block created',
          app.chain.block?.lastTime.format('HH:mm:ss')
        ),
        stat('Target block time', `${app.chain.block?.duration} sec`),
        header('Balances'),
        stat('Total EDG', formatCoin(substrate.chain.totalbalance)),
        stat(
          'Existential deposit',
          formatCoin(substrate.chain.existentialdeposit)
        ),
        // stat('Transfer fee',        formatCoin(substrate.chain.transferfee)),
        header('Democracy Proposals'),
        stat(
          'Launch period',
          formatBlocks(substrate.democracyProposals.launchPeriod)
        ),
        stat(
          'Minimum deposit',
          formatCoin(substrate.democracyProposals.minimumDeposit)
        ),
        header('Phragmen Elections'),
        stat(
          'Term length',
          formatBlocks(substrate.phragmenElections.termDuration)
        ),
        stat('Voting bond', formatCoin(substrate.phragmenElections.votingBond)),
        stat(
          'Candidacy bond',
          formatCoin(substrate.phragmenElections.candidacyBond)
        ),
        m('br'),
      ]
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
    const profiles = app.profiles.store.getAll();
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
        return this.profiles[key].address;
      });
      this.selectedProfile = adminChoices[0];
    }

    return m('.AdminActions', [
      m('h4', 'Admin'),
      m('p', 'Set up the chain with test proposals'),
      m('p', 'Run individual test suites (suite 1 required before 2 and 3)'),
      m('p', 'Create identities'),
      // m('button', {
      //   class: this.inprogress ? 'disabled' : '',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     console.log('registering and attesting identities for initial council set');
      //     this.inprogress = true;
      //   }
      // }, this.inprogress ? 'Creating identities' : 'Create identities'),
      // m('br'),
      m('br'),
      m('h4', 'Site admin panel (unimplemented)'),
      m('.form', [
        m('.form-left', [
          // TD: verify this is correct char lim
          m(
            '.caption',
            { style: 'margin-top: 20px;' },
            'Choose a possible admin'
          ),
          m(DropdownFormField, {
            name: 'alt-del',
            options: { style: 'padding: 5px' },
            choices: adminChoices,
            callback: (result) => {
              this.selectedProfile = result;
            },
          }),
        ]),
        m('.explanation', [
          m('span', [
            'This list contains all potential ',
            'individuals to make admin. ',
          ]),
        ]),
        m('.form-left', [
          // TD: verify this is correct char lim
          m('.caption', { style: 'margin-top: 20px;' }, 'Choose a role'),
          m(DropdownFormField, {
            name: 'alt-del',
            options: { style: 'padding: 5px' },
            choices: [
              {
                name: 'siteAdmin',
                label: 'siteAdmin',
                value: 'siteAdmin',
              },
              {
                name: 'chainAdmin',
                label: 'chainAdmin',
                value: 'chainAdmin',
              },
            ],
            callback: (result) => {
              this.role = result;
            },
          }),
        ]),
        m(
          'button',
          {
            class: this.inprogress ? 'disabled' : '',
            onclick: (e) => {
              e.preventDefault();
              this.inprogress = true;
              // TODO: Change to PUT /adminStatus
              $.post(`${app.serverUrl()}/updateAdminStatus`, {
                admin: app.user.activeAccount.address,
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
            },
          },
          this.inprogress ? `Adding ${this.selectedProfile}` : 'Add admin'
        ),
      ]),
      m('br'),
      m('br'),
    ]);
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
