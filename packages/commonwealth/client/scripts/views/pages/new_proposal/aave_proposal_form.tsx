/* @jsx m */

import ClassComponent from 'class_component';
import type { Executor } from 'common-common/src/eth/types';
import { notifyError } from 'controllers/app/notifications';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import type { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import { utils } from 'ethers';
import m from 'mithril';

import 'pages/new_proposal/aave_proposal_form.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import type { AaveProposalState } from './types';
import { defaultStateItem } from './types';

export class AaveProposalForm extends ClassComponent {
  private aaveProposalState: Array<AaveProposalState>;
  private activeTabIndex: number;
  private executor: Executor | string;
  private ipfsHash: string;
  private proposer: string;
  private tabCount: number;

  oninit() {
    this.aaveProposalState = [defaultStateItem];
    this.activeTabIndex = 0;
    this.tabCount = 1;
  }

  view() {
    const author = app.user.activeAccount;
    const aave = app.chain as Aave;
    const { activeTabIndex, aaveProposalState } = this;

    return (
      <div class="AaveProposalForm">
        <div class="row-with-label">
          <CWLabel label="Proposer (you)" />
          {m(User, {
            user: author,
            linkify: true,
            popover: true,
            showAddressWithDisplayName: true,
          })}
        </div>
        <CWTextInput
          label="IPFS Hash"
          placeholder="Proposal IPFS Hash"
          oninput={(e) => {
            this.ipfsHash = e.target.value;
          }}
        />
        <div class="row-with-label">
          <CWLabel label="Executor" />
          <div class="executors-container">
            {aave.governance.api.Executors.map((r) => (
              <div
                class={`executor ${
                  this.executor === r.address && 'selected-executor'
                }`}
                onclick={() => {
                  this.executor = r.address;
                }}
              >
                <div class="executor-row">
                  <CWText fontWeight="medium">Address</CWText>
                  <CWText type="caption" noWrap>
                    {r.address}
                  </CWText>
                </div>
                <div class="executor-row">
                  <CWText fontWeight="medium">Time Delay</CWText>
                  <CWText type="caption">
                    {r.delay / (60 * 60 * 24)} Day(s)
                  </CWText>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div class="tab-selector">
          <CWTabBar>
            {aaveProposalState.map((_, index) => (
              <CWTab
                label={`Call ${index + 1}`}
                isSelected={activeTabIndex === index}
                onclick={() => {
                  this.activeTabIndex = index;
                }}
              />
            ))}
          </CWTabBar>
          <CWPopoverMenu
            menuItems={[
              {
                iconLeft: 'write',
                label: 'Add',
                onclick: () => {
                  this.tabCount++;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.push(defaultStateItem);
                },
              },
              {
                iconLeft: 'trash',
                label: 'Delete',
                disabled: this.activeTabIndex === 0,
                onclick: () => {
                  this.tabCount--;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.pop();
                },
              },
            ]}
            trigger={<CWIconButton iconName="plus" />}
          />
        </div>
        <CWTextInput
          label="Target Address"
          placeholder="Add Target"
          value={aaveProposalState[activeTabIndex].target}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].target = e.target.value;
          }}
        />
        <CWTextInput
          label="Value"
          placeholder="Enter amount in wei"
          value={aaveProposalState[activeTabIndex].value}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].value = e.target.value;
          }}
        />
        <CWTextInput
          label="Calldata"
          placeholder="Add Calldata"
          value={aaveProposalState[activeTabIndex].calldata}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].calldata = e.target.value;
          }}
        />
        <CWTextInput
          label="Function Signature (Optional)"
          placeholder="Add a signature"
          value={aaveProposalState[activeTabIndex].signature}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].signature = e.target.value;
          }}
        />
        <CWCheckbox
          checked={this.aaveProposalState[activeTabIndex].withDelegateCall}
          onchange={() => {
            this.aaveProposalState[activeTabIndex].withDelegateCall = !this
              .aaveProposalState[activeTabIndex].withDelegateCall;
          }}
          label="Delegate Call"
          value=""
        />
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            this.proposer = app.user?.activeAccount?.address;

            if (!this.proposer) {
              throw new Error('Invalid address / not logged in');
            }

            if (!this.executor) {
              throw new Error('Invalid executor');
            }

            if (!this.ipfsHash) {
              throw new Error('No ipfs hash');
            }

            const targets = [];
            const values = [];
            const calldatas = [];
            const signatures = [];
            const withDelegateCalls = [];

            for (let i = 0; i < this.tabCount; i++) {
              const aaveProposal = this.aaveProposalState[i];

              if (aaveProposal.target) {
                targets.push(aaveProposal.target);
              } else {
                throw new Error(`No target for Call ${i + 1}`);
              }

              values.push(aaveProposal.value || '0');
              calldatas.push(aaveProposal.calldata || '');
              withDelegateCalls.push(aaveProposal.withDelegateCall || false);
              signatures.push(aaveProposal.signature || '');
            }

            // TODO: preload this ipfs value to ensure it's correct
            const ipfsHash = utils.formatBytes32String(this.ipfsHash);

            const details: AaveProposalArgs = {
              executor: this.executor as string,
              targets,
              values,
              calldatas,
              signatures,
              withDelegateCalls,
              ipfsHash,
            };

            aave.governance
              .propose(details)
              .then(() => m.redraw())
              .catch((err) => notifyError(err.data?.message || err.message));
          }}
        />
      </div>
    );
  }
}
