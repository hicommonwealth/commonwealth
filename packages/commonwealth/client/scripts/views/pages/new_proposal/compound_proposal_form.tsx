/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import type { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';

import 'pages/new_proposal/compound_proposal_form.scss';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import type { AaveProposalState } from './types';
import { defaultStateItem } from './types';

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
      <div className="CompoundProposalForm">
        <div className="row-with-label">
          <CWLabel label="Proposer (you)" />
          <User user={author} linkify popover showAddressWithDisplayName />
        </div>
        <CWTextInput
          label="Proposal Title (leave blank for no title)"
          placeholder="Proposal Title"
          onInput={(e) => {
            this.title = e.target.value;
          }}
        />
        <CWTextArea
          label="Proposal Description"
          placeholder="Proposal Description"
          onInput={(e) => {
            this.description = e.target.value;
          }}
        />
        <div className="tab-selector">
          <CWTabBar>
            {aaveProposalState.map((_, index) => (
              <CWTab
                label={`Call ${index + 1}`}
                isSelected={activeTabIndex === index}
                onClick={() => {
                  this.activeTabIndex = index;
                }}
              />
            ))}
          </CWTabBar>
          <PopoverMenu
            menuItems={[
              {
                iconLeft: 'write',
                label: 'Add',
                onClick: () => {
                  this.tabCount++;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.push(defaultStateItem);
                },
              },
              {
                iconLeft: 'trash',
                label: 'Delete',
                onClick: () => {
                  this.tabCount--;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.pop();
                },
              },
            ]}
            renderTrigger={(onclick) => (
              <CWIconButton iconName="plus" onClick={onclick} />
            )}
          />
        </div>
        <CWTextInput
          label="Target Address"
          placeholder="Add Target"
          value={aaveProposalState[activeTabIndex].target}
          onInput={(e) => {
            this.aaveProposalState[activeTabIndex].target = e.target.value;
          }}
        />
        <CWTextInput
          label="Value"
          placeholder="Enter amount in wei"
          value={aaveProposalState[activeTabIndex].value}
          onInput={(e) => {
            this.aaveProposalState[activeTabIndex].value = e.target.value;
          }}
        />
        <CWTextInput
          label="Calldata"
          placeholder="Add Calldata"
          value={aaveProposalState[activeTabIndex].calldata}
          onInput={(e) => {
            this.aaveProposalState[activeTabIndex].calldata = e.target.value;
          }}
        />
        <CWTextInput
          label="Function Signature (Optional)"
          placeholder="Add a signature"
          value={aaveProposalState[activeTabIndex].signature}
          onInput={(e) => {
            this.aaveProposalState[activeTabIndex].signature = e.target.value;
          }}
        />
        <CWButton
          label="Send transaction"
          onClick={(e) => {
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
                redraw();
              })
              .catch((err) => notifyError(err.data?.message || err.message));
          }}
        />
      </div>
    );
  }
}
