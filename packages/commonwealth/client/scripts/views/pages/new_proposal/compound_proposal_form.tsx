/* @jsx m */

import ClassComponent from 'class_component';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';
import m from 'mithril';

import 'pages/new_proposal/compound_proposal_form.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { AaveProposalState, defaultStateItem } from './types';

export class CompoundProposalForm extends ClassComponent {
  private aaveProposalState: Array<AaveProposalState>;
  private activeTabIndex: number;
  private description: string;
  private proposer: string;
  private tabCount: number;
  private title: string;

  oninit() {
    this.aaveProposalState = [defaultStateItem];
    this.activeTabIndex = 0;
    this.tabCount = 1;
  }

  view() {
    const author = app.user.activeAccount;
    const { activeTabIndex, aaveProposalState } = this;

    return (
      <div class="CompoundProposalForm">
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
          label="Proposal Title (leave blank for no title)"
          placeholder="Proposal Title"
          oninput={(e) => {
            this.title = e.target.value;
          }}
        />
        <CWTextArea
          label="Proposal Description"
          placeholder="Proposal Description"
          oninput={(e) => {
            this.description = e.target.value;
          }}
        />
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
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            this.proposer = app.user?.activeAccount?.address;

            if (!this.proposer) {
              throw new Error('Invalid address / not logged in');
            }

            if (!this.description) {
              throw new Error('Invalid description');
            }

            const targets = [];
            const values = [];
            const calldatas = [];
            const signatures = [];

            for (let i = 0; i < this.tabCount; i++) {
              const aaveProposal = this.aaveProposalState[i];
              if (aaveProposal.target) {
                targets.push(aaveProposal.target);
              } else {
                throw new Error(`No target for Call ${i + 1}`);
              }

              values.push(aaveProposal.value || '0');
              calldatas.push(aaveProposal.calldata || '');
              signatures.push(aaveProposal.signature || '');
            }

            // if they passed a title, use the JSON format for description.
            // otherwise, keep description raw
            let description = this.description;

            if (this.title) {
              description = JSON.stringify({
                description: this.description,
                title: this.title,
              });
            }

            const details: CompoundProposalArgs = {
              description,
              targets,
              values,
              calldatas,
              signatures,
            };

            (app.chain as Compound).governance
              .propose(details)
              .then((result: string) => {
                notifySuccess(`Proposal ${result} created successfully!`);
                m.redraw();
              })
              .catch((err) => notifyError(err.data?.message || err.message));
          }}
        />
      </div>
    );
  }
}
