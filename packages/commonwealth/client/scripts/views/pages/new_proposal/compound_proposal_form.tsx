/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal/compound_proposal_form.scss';

import app from 'state';
import { ITXModalData, ProposalModule } from 'models';
import { proposalSlugToClass } from 'identifiers';
import { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import User from 'views/components/widgets/user';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { AaveProposalState, defaultStateItem } from './types';
import { CWButton } from '../../components/component_kit/cw_button';
import { ProposalType } from '../../../../../../common-common/src/types';
import { createTXModal } from '../../modals/tx_signing_modal';

export class CompoundProposalForm extends ClassComponent {
  private aaveProposalState: Array<AaveProposalState>;
  private activeTabIndex: number;
  private description: string;
  private proposer;
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
            const result = (e.target as any).value;
            this.title = result;
            m.redraw();
          }}
        />
        <CWTextArea
          label="Proposal Description"
          placeholder="Proposal Description"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.description = result;
            m.redraw();
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
            const result = (e.target as any).value;
            this.aaveProposalState[activeTabIndex].target = result;
            m.redraw();
          }}
        />
        <CWTextInput
          label="Value"
          placeholder="Enter amount in wei"
          value={aaveProposalState[activeTabIndex].value}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.aaveProposalState[activeTabIndex].value = result;
            m.redraw();
          }}
        />
        <CWTextInput
          label="Calldata"
          placeholder="Add Calldata"
          value={aaveProposalState[activeTabIndex].calldata}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.aaveProposalState[activeTabIndex].calldata = result;
            m.redraw();
          }}
        />
        <CWTextInput
          label="Function Signature (Optional)"
          placeholder="Add a signature"
          value={aaveProposalState[activeTabIndex].signature}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.aaveProposalState[activeTabIndex].signature = result;
            m.redraw();
          }}
        />
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            const createFunc: (
              ...args
            ) => ITXModalData | Promise<ITXModalData> = (a) => {
              return (
                proposalSlugToClass().get(
                  ProposalType.AaveProposal
                ) as ProposalModule<any, any, any>
              ).createTx(...a);
            };

            const args = [];

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

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </div>
    );
  }
}
