import 'pages/admin.scss';

import { default as $ } from 'jquery';
import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import { SubmittableResult, ApiRx } from '@polkadot/api';
import { ISubmittableResult } from '@polkadot/types/types';
import { switchMap } from 'rxjs/operators';

import app from 'state';
import { blockperiodToDuration, formatDuration } from 'helpers';
import { ChainInfo, NodeInfo } from 'models';
import { formatCoin } from 'adapters/currency';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import { DropdownFormField } from 'views/components/forms';
import Tabs from 'views/components/widgets/tabs';
import User from 'views/components/widgets/user';
import CreateCommunityModal from 'views/modals/create_community_modal';
import CreateInviteModal from 'views/modals/create_invite_modal';
import PageLoading from 'views/pages/loading';

interface IChainManagerAttrs {
  success?: string;
  error?: string;
}

interface IChainManagerState {
  error: string;
  success: string;
}

const ChainManager: m.Component<IChainManagerAttrs, IChainManagerState> = {
  view: (vnode) => {

    const nodeRows = (chain) =>
      (app.config.nodes.getByChain(chain.id) || []).map((node, nodeIndex) => m('li.chain-node', [
        m('span', node.url),
        ' ',
        m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            if (!app.login.jwt) return alert('Login required');
            if (!app.login.isSiteAdmin) return alert('Admin required');
            vnode.attrs.success = null;
            vnode.attrs.error = null;
            if (!confirm('Are you sure?')) return;
            $.post(app.serverUrl() + '/deleteChainNode', {
              id: chain.id,
              node_url: node.url,
              auth: true,
              jwt: app.login.jwt,
            }).then((result) => {
              if (result.status !== 'Success') return;
              app.config.nodes.remove(node);
              vnode.attrs.success = 'Successfully deleted';
              m.redraw();
            }, (err) => {
              vnode.state.error = err.responseJSON ?
                err.responseJSON.error :
                (err.status + ': ' + err.statusText);
              m.redraw();
            });
          }
        }, 'Remove'),
      ]));

    const addNodeRow = (chain) =>
      m('li', [
        m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            if (!app.login.jwt) return alert('Login required');
            if (!app.login.isSiteAdmin) return alert('Admin required');
            vnode.attrs.success = null;
            vnode.attrs.error = null;
            const url = prompt('Enter the node url:');
            $.post(app.serverUrl() + '/addChainNode', {
              id: chain.id,
              name: chain.name,
              symbol: chain.symbol,
              network: chain.network,
              node_url: url,
              auth: true,
              jwt: app.login.jwt,
            }).then((result) => {
              app.config.nodes.add(new NodeInfo(result.result.id, result.result.chain, result.result.url));
              vnode.state.success = 'Sucessfully added';
              m.redraw();
            }, (err) => {
              vnode.state.error = err.responseJSON ?
                err.responseJSON.error :
                (err.status + ': ' + err.statusText);
              m.redraw();
            });
          }
        }, 'Add')
      ]);

    return m('.ChainManager', [
        m('button', {
          onclick: (e) => app.modals.create({ modal: CreateCommunityModal })
        }, 'Add a new offchain community'),
        (app.config.chains.getAll() || []).map((chain) => m('.chain-row', [
        m('h3', [
          m('strong', chain.name),
          m('span.lighter', {
            style: 'font-weight: 400; color: #999; margin-left: 6px;'
          }, chain.symbol),
        ]),
        m('.chain-subtitle', {
            style: 'margin: -14px 0 10px; color: #999;'
        }, `${chain.id} (Network: ${chain.network})`),
        m('ul.chain-info', [
          nodeRows(chain),
          addNodeRow(chain),
        ])
      ])),
      (app.config.communities.getAll() || []).map((community) => m('.chain-row', [
        m('h3', [
          m('strong', community.name),
        ]),
        m('.chain-subtitle', {
            style: 'margin: -14px 0 10px; color: #999;'
        }, `${community.id}`),
      ])),
      vnode.state.success && m('.success-message', {
        style: 'color: #5eaf77; font-weight: 600; margin: 10px 0;'
      }, vnode.state.error),
      vnode.state.error && m('.error-message', {
        style: 'color: red; font-weight: 600; margin: 10px 0;'
      }, vnode.state.error),
    ]);
  }
};

interface ISudoFormState {
  txProcessing: boolean;
  resultText: string;
}

const SudoForm: m.Component<{}, ISudoFormState> = {
  view: (vnode) => {
    const author = app.vm.activeAccount as SubstrateAccount;
    if (!(app.chain as Substrate).chain.sudoKey) {
      return m('.SudoForm', {
        style: 'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;'
      }, 'No sudo key available on this chain.');
    }

    if (author && author.address !== (app.chain as Substrate).chain.sudoKey) {
      return m('.SudoForm', {
        style: 'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;'
      }, [
        'Must be logged into admin account to use Sudo: ',
        m(User, { user: app.chain.accounts.get((app.chain as Substrate).chain.sudoKey) }),
      ]);
    }

    let keyring;
    try {
      keyring = author.getKeyringPair();
    } catch (e) {
      return m('.SudoForm', {
        style: 'padding: 20px 24px; border: 1px solid #eee; margin-bottom: 40px;'
      }, 'Account must be unlocked to use Sudo.');
    }

    return m('.SudoForm', {
      style: 'width: 80%; padding: 5px 24px; border: 1px solid #eee; margin-bottom: 15px;'
    }, [
      m('h2.header', { style: 'margin: 15px 0;' }, 'Sudo: run function as Admin'),
      m(EdgewareFunctionPicker),
      m('button', {
        type: 'submit',
        disabled: vnode.state.txProcessing,
        onclick: (e) => {
          e.preventDefault();
          const call = EdgewareFunctionPicker.getMethod();
          vnode.state.txProcessing = true;
          vnode.state.resultText = 'Waiting...';
          m.redraw();
          (app.chain as Substrate).chain.api.pipe(
            switchMap((api: ApiRx) => api.tx.sudo.sudo(call).signAndSend(keyring))
          ).subscribe((result: ISubmittableResult) => {
            if (result.isCompleted) {
              vnode.state.txProcessing = false;
              if (result.isFinalized) {
                vnode.state.resultText = 'Action completed successfully.';
              } else {
                vnode.state.resultText = 'Action was unsuccessful.';
              }
              m.redraw();
            }
          });
        }
      }, 'Submit Action'),
      m('h4.header', { style: 'margin: 15px 0;' }, vnode.state.resultText),
      m('br'),
    ]);
  }
};

const ChainStats: m.Component<{}> = {
  view: (vnode) => {
    const header = (label) => m('h4.header', { style: 'margin: 15px 0;' }, label);
    const stat = (label, content) => m('.stat', [ m('.label', label), m('.value', content) ]);
    const formatBlocks = (blocks) =>
      [blocks, ' blocks - ', formatDuration(blockperiodToDuration(blocks))];

    return m('.ChainStats', {
      style: 'padding: 5px 24px; border: 1px solid #eee; margin-bottom: 40px;'
    }, [
      m('style', '.ChainStats .stat > * { display: inline-block; width: 50%; }'),
      header('ChainInfo'),
      stat('ChainInfo',               app.activeChainId()),
      stat('ChainInfo Name',          app.chain.name?.toString()),
      stat('ChainInfo Version',       app.chain.version?.toString()),
      stat('ChainInfo Runtime',       app.chain.runtimeName?.toString()),
      header('Block Production'),
      stat('Current block',       app.chain.block?.height),
      stat('Last block created',  app.chain.block?.lastTime.format('HH:mm:ss')),
      stat('Target block time',   app.chain.block?.duration + ' sec'),
      header('Balances'),
      stat('Total EDG',           formatCoin((app.chain as Substrate).chain.totalbalance)),
      stat('Existential deposit', formatCoin((app.chain as Substrate).chain.existentialdeposit)),
      //stat('Transfer fee',        formatCoin((app.chain as Substrate).chain.transferfee)),
      stat('Creation fee',        formatCoin((app.chain as Substrate).chain.creationfee)),
      header('Democracy Proposals'),
      stat('Launch period',       formatBlocks((app.chain as Substrate).democracyProposals.launchPeriod)),
      stat('Minimum deposit',     formatCoin((app.chain as Substrate).democracyProposals.minimumDeposit)),
      header('Phragmen Elections'),
      stat('Term length',         formatBlocks((app.chain as Substrate).phragmenElections.termDuration)),
      stat('Voting bond',         formatCoin((app.chain as Substrate).phragmenElections.votingBond)),
      stat('Candidacy bond',      formatCoin((app.chain as Substrate).phragmenElections.candidacyBond)),
      m('br'),
    ]);
  }
};

/*
const ProposalCreationRow = {
  view: (vnode) => {
    return m('span', [
      m('p', `Create ${vnode.attrs.name} proposal`),
      m('button', {
        class: vnode.state.inprogress ? 'disabled' : '',
        onclick: (e) => {
          e.preventDefault();
          vnode.state.inprogress = true;
          vnode.attrs.func().subscribe(
            (e: SubmittableResult) => {
              if (e.status.isReady) {
                vnode.state.inprogress = true;
              } else if (e.status.isFinalized) {
                vnode.state.inprogress = false;
              } else {
                console.log(e);
                vnode.state.inprogress = false;
                throw new Error(e.status.type.toString());
              }
            },
            (e: Error) => {
              console.log(`${vnode.attrs.name} proposal err`, e);
            }
          );
        }
      }, vnode.state.inprogress ? 'Creating proposal' : 'Create proposal')
    ]);
  }
};
*/

interface IAdminActionsState {
  inprogress: boolean;
  disabled: boolean;
  success: boolean;
  failure: boolean;
  error: string;
  profiles: object;
  selected_profile: string;
  role: string;
}

const AdminActions: m.Component<{}, IAdminActionsState> = {
  oninit: (vnode: m.VnodeDOM<{}, IAdminActionsState>) => {
    const profiles = app.profiles.store.getAll();
    vnode.state.profiles = {};

    for (const profile in profiles) {
      if (profile) {
        vnode.state.profiles[profile] = {
          address: profiles[profile].address,
          name: profiles[profile].name
        };
      }
    }
  },
  view: (vnode: m.VnodeDOM<{}, IAdminActionsState>) => {

    let adminChoices;
    if (vnode.state.profiles) {
      adminChoices = Object.keys(vnode.state.profiles).map((key) => {
        return vnode.state.profiles[key].address;
      });
      vnode.state.selected_profile = adminChoices[0];
    }

    const testButton = (testName, f) => {
      return m('button', {
        class: vnode.state.inprogress ? 'disabled' : '',
        onclick: (e) => {
          e.preventDefault();
          try {
            vnode.state.inprogress = true;
            f().subscribe(() => {
              vnode.state.inprogress = false;
              //EdgewareTesting.get().isTesting = false;
            }, (e: Error) => {
              console.error('Test error: ', e);
              vnode.state.inprogress = false;
              //EdgewareTesting.get().isTesting = false;
            });
          } catch (e) {
            vnode.state.inprogress = false;
            //EdgewareTesting.get().isTesting = false;
            throw e;
          }
        },
      }, vnode.state.inprogress ? `Test in progress...` : `Start ${testName}`);
    };

    return m('.AdminActions', [
      m('h4', 'Admin'),
      m('p', 'Set up the chain with test proposals'),
      m('p', 'Run individual test suites (suite 1 required before 2 and 3)'),
      m('p', 'Create identities'),
      // m('button', {
      //   class: vnode.state.inprogress ? 'disabled' : '',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     console.log('registering and attesting identities for initial council set');
      //     vnode.state.inprogress = true;
      //   }
      // }, vnode.state.inprogress ? 'Creating identities' : 'Create identities'),
      // m('br'),
      m('br'),
      m('h4', 'Site admin panel (unimplemented)'),
      m('.form', [
        m('.form-left', [
          // TD: verify this is correct char lim
          m('.caption', {style: 'margin-top: 20px;'}, 'Choose a possible admin'),
          m(DropdownFormField, {
            name: 'alt-del',
            options: { style: 'padding: 5px'},
            choices: adminChoices,
            callback: (result) => {
              vnode.state.selected_profile = result;
              console.log(vnode.state.selected_profile);
            }
          })
        ]),
        m('.explanation', [
          m('span', [
            'This list contains all potential ',
            'individuals to make admin. ',
          ])
        ]),
        m('.form-left', [
          // TD: verify this is correct char lim
          m('.caption', {style: 'margin-top: 20px;'}, 'Choose a role'),
          m(DropdownFormField, {
            name: 'alt-del',
            options: { style: 'padding: 5px'},
            choices: [
              {
                name: 'siteAdmin',
                label: 'siteAdmin',
                value: 'siteAdmin'
              },
              {
                name: 'chainAdmin',
                label: 'chainAdmin',
                value: 'chainAdmin'
              }
            ],
            callback: (result) => vnode.state.role = result
          })
        ]),
        m('button', {
          class: vnode.state.inprogress ? 'disabled' : '',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.inprogress = true;
            console.log(vnode.state.selected_profile);
            console.log(vnode.state.role);
            $.post(app.serverUrl() + '/updateAdminStatus', {
              admin: app.vm.activeAccount.address,
              address: vnode.state.selected_profile, // the address to be changed
              role: vnode.state.role,
              jwt: app.login.jwt,
            }).then((response) => {
                if (response.status === 'Success') {
                  if (!app.isLoggedIn()) {
                    mixpanel.track('Add Admin', {
                      'Step No': 1,
                      'Step': 'Add Admin'
                    });
                  }
                  m.redraw();
                } else {
                  // error tracking
                }
                vnode.state.inprogress = false;
              }, (err) => {
                vnode.state.failure = true;
                vnode.state.disabled = false;
                if (err.responseJSON) vnode.state.error = err.responseJSON.error;
                m.redraw();
            });
          }
        }, vnode.state.inprogress ? `Adding ${vnode.state.selected_profile}` : `Add admin`),
      ]),
      m('br'),
      m('br'),
    ]);
  }
};
export const CreateInviteLink: m.Component<{onChangeHandler?: Function}, {link}> = {
  oninit: (vnode) => {
    vnode.state.link = '';
  },
  view: (vnode: m.VnodeDOM<{onChangeHandler?: Function}, {link}>) => {
    return m('.CreateInviteLink', [
      m('h4', 'Option 3: Create invite link'),
      m('form.invite-link-parameters', [
        m('label', { for: 'uses', }, 'Number of uses:'),
        m('select', { name: 'uses' }, [
          m('option', { value: 'none', }, 'Unlimited'),
          m('option', { value: 1, }, 'Once'),
          //m('option', { value: 2, }, 'Twice'),
        ]),
        m('label', { for: 'time', }, 'Expires after:'),
        m('select', { name: 'time' }, [
          m('option', { value: 'none', }, 'None'),
          m('option', { value: '24h', }, '24 hours'),
          m('option', { value: '48h', }, '48 hours'),
          m('option', { value: '1w', }, '1 week'),
          m('option', { value: '30d', }, '30 days'),
        ]),
        m('button.submit.formular-button-primary', {
          onclick: (e) => {
            e.preventDefault();
            const time = $(vnode.dom).find('[name="time"] option:selected').val();
            const uses = $(vnode.dom).find('[name="uses"] option:selected').val();
            $.post(`${app.serverUrl()}/createInviteLink`, {
              community_id: app.activeCommunityId(),
              time,
              uses,
              jwt: app.login.jwt,
            }).then((response) => {
              const linkInfo = response.result;
              const url = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
              if (vnode.attrs.onChangeHandler) vnode.attrs.onChangeHandler(linkInfo);
              vnode.state.link = `${url}${app.serverUrl()}/acceptInviteLink?id=${linkInfo.id}`;
              m.redraw();
            });
          }
        }, 'Get invite link'),
        m('input.invite-link-pastebin', {
          disabled: true,
          value: `${vnode.state.link}`,
        }),
      ]),
    ]);
  }
};

const InviteLinkRow: m.Component<{data}, {link}> = {
  oninit: (vnode) => {
    vnode.state.link = vnode.attrs.data;
  },
  view: (vnode) => {
    const { id, active, multi_use, used, time_limit, created_at } = vnode.state.link;
    const server = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
    const url = `${server}${app.serverUrl()}/acceptInviteLink?id=${id}`;

    return m('tr.InviteLinkRow', [
      m('td', [m('input', {
        disabled: true,
        value: `${url}`
      }),]),
      m('td.active', `${active} `),
      m('td.multi_use', `${multi_use} `),
      m('td.used', `${used} `),
      m('td.time_limit', `${time_limit} `),
      m('td.create_at', `${created_at.slice(0, 10)} `),
    ]);
  }
};

const InviteLinkTable: m.Component<{links}, {links}> = {
  oninit: (vnode) => {
    vnode.state.links = [];
  },
  oncreate: (vnode) => {
    $.get(`${app.serverUrl()}/getInviteLinks`, {
      address: app.vm.activeAccount.address,
      community_id: app.activeCommunityId(),
      jwt: app.login.jwt,
    }).then((res) => {
      res.data.map((link) => vnode.state.links.push(link));
      m.redraw();
    });
  },
  view: (vnode) => {
    if (vnode.attrs.links.length > 0) {
      const newLink = vnode.attrs.links[vnode.attrs.links.length - 1];
      if (!vnode.state.links.some((link) => newLink.id === link.id)) {
        vnode.state.links.push(newLink);
      }
    }
    return m('.InviteLinkTable', [
      m('h3', `All Historic Invite Links for "${app.activeCommunityId()}"`),
      m('table', [
        (vnode.state.links.length > 0) &&
        m('tr', [
          m('th', 'Link'), m('th', 'Active?'), m('th', 'Uses'),
          m('th', 'Times Used'), m('th', 'Time Limit'), m('th', 'Date Created'),
        ]),
        (vnode.state.links.length > 0) ?
          vnode.state.links.sort((a, b) => (a.created_at < b.created_at) ? 1 : -1).map((link) => {
            return m(InviteLinkRow, {
              data: link,
            });
          }) : m('h4', 'No Invite Links created yet– Make One!')
      ])
    ]);
  }
};

const GenericInviteLinks: m.Component<{}, {newlinks}> = {
  oninit: (vnode) => {
    vnode.state.newlinks = [];
  },
  view: (vnode) => {
    return m('.GenericInviteLinks', [
      m(CreateInviteLink, {
        onChangeHandler: (result) => {
          vnode.state.newlinks.push(result);
        },
      }),
      m(InviteLinkTable, {
        links: vnode.state.newlinks,
      }),
    ]);
  }
};

const AdminPage: m.Component<{}> = {
  oncreate: (vnode) => {
      mixpanel.track('PageVisit', {
        'Page Name': 'AdminPage',
        'Scope': app.activeId() ,
      });
  },
  view: (vnode) => {
    if (!app.login.isSiteAdmin) {
      m.route.set('/', {}, { replace: true });
      return m(PageLoading);
    }

    return m('.AdminPage', [
      m('.forum-container', [
        m(Tabs, [{
          name: 'Admin',
          content: app.community ? [ m(AdminActions), ] :
            app.chain ? [ m(AdminActions), m(SudoForm), m(ChainStats) ] : []
        }, {
          name: 'Manage Chains and Nodes',
          content: m(ChainManager),
        }, {
          name: 'Generic Invite Links',
          content: m(GenericInviteLinks),
        }]),
      ]),
    ]);
  }
};

export default AdminPage;
