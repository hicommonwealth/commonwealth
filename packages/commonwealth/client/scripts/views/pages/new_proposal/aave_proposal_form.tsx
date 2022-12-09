/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal/aave_proposal_form.scss';

import app from 'state';
import { Account } from 'models';
import User from 'views/components/widgets/user';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

type AaveProposalFormAttrs = {
  author: Account;
};

type AaveProposalState = {
  target;
  value;
  calldata;
  signature;
  withDelegateCall: boolean;
};

export class AaveProposalForm extends ClassComponent<AaveProposalFormAttrs> {
  private tabCount: number;
  private activeTabIndex: number;
  private aaveProposalState: Array<AaveProposalState>;
  private executor;
  private ipfsHash;

  oninit() {
    this.tabCount = 1;
    this.activeTabIndex = 0;
    this.aaveProposalState = [
      {
        target: null,
        value: null,
        calldata: null,
        signature: null,
        withDelegateCall: false,
      },
    ];
  }

  view(vnode: m.Vnode<AaveProposalFormAttrs>) {
    const { author } = vnode.attrs;
    const { activeTabIndex, aaveProposalState } = this;

    return (
      <div class="AaveProposalForm">
        <div>
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
            const result = (e.target as any).value;
            this.ipfsHash = result;
            m.redraw();
          }}
        />
        <CWLabel label="Executor" />
        {(app.chain as Aave).governance.api.Executors.map((r) => (
          <div
            class={`executor ${
              this.executor === r.address && '.selected-executor'
            }`}
            onclick={() => {
              this.executor = r.address;
            }}
          >
            <div class="label">Address</div> <div>{r.address}</div>
            <div class="label mt-16">Time Delay</div>
            <div>{r.delay / (60 * 60 * 24)} Day(s)</div>
          </div>
        ))}
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
                  this.aaveProposalState.push({
                    target: null,
                    value: null,
                    calldata: null,
                    signature: null,
                    withDelegateCall: false,
                  });
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
        <div class="delegate-call-container">
          <CWLabel label="Delegate Call" />
          <div class="buttons-row">
            <CWButton
              label="TRUE"
              // class: `button ${
              //   aaveProposalState[activeAaveTabIndex].withDelegateCall ===
              //     true && 'active'
              // }`,
              onclick={() => {
                this.aaveProposalState[activeTabIndex].withDelegateCall = true;
              }}
            />
            <CWButton
              label="FALSE"
              // class: `ml-12 button ${
              //   aaveProposalState[activeAaveTabIndex].withDelegateCall ===
              //     false && 'active'
              // }`,
              onclick={() => {
                this.aaveProposalState[activeTabIndex].withDelegateCall = false;
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
