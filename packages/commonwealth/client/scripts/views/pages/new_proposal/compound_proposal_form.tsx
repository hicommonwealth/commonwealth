import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import type { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';

import 'pages/new_proposal/compound_proposal_form.scss';
import React, { useState } from 'react';

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

export const CompoundProposalForm = () => {
  const [aaveProposalState, setAaveProposalState] = useState<
    Array<AaveProposalState>
  >([defaultStateItem]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [description, setDescription] = useState('');
  const [proposer, setProposer] = useState('');
  const [tabCount, setTabCount] = useState(1);
  const [title, setTitle] = useState('');

  const author = app.user.activeAccount;

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
          setTitle(e.target.value);
        }}
      />
      <CWTextArea
        label="Proposal Description"
        placeholder="Proposal Description"
        onInput={(e) => {
          setDescription(e.target.value);
        }}
      />
      <div className="tab-selector">
        <CWTabBar>
          {aaveProposalState.map((_, index) => (
            <CWTab
              label={`Call ${index + 1}`}
              isSelected={activeTabIndex === index}
              onClick={() => {
                setActiveTabIndex(index);
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
                setTabCount(tabCount + 1);
                setActiveTabIndex(tabCount - 1);

                const newAaveProposalState = aaveProposalState.concat([
                  defaultStateItem,
                ]);

                setAaveProposalState(newAaveProposalState);
              },
            },
            {
              iconLeft: 'trash',
              label: 'Delete',
              onClick: () => {
                setTabCount(tabCount - 1);
                setActiveTabIndex(tabCount - 1);

                const newAaveProposalState = aaveProposalState.filter(
                  (_, i) => i !== aaveProposalState.length - 1
                );

                setAaveProposalState(newAaveProposalState);
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
          aaveProposalState[activeTabIndex].target = e.target.value;
        }}
      />
      <CWTextInput
        label="Value"
        placeholder="Enter amount in wei"
        value={aaveProposalState[activeTabIndex].value}
        onInput={(e) => {
          aaveProposalState[activeTabIndex].value = e.target.value;
        }}
      />
      <CWTextInput
        label="Calldata"
        placeholder="Add Calldata"
        value={aaveProposalState[activeTabIndex].calldata}
        onInput={(e) => {
          aaveProposalState[activeTabIndex].calldata = e.target.value;
        }}
      />
      <CWTextInput
        label="Function Signature (Optional)"
        placeholder="Add a signature"
        value={aaveProposalState[activeTabIndex].signature}
        onInput={(e) => {
          aaveProposalState[activeTabIndex].signature = e.target.value;
        }}
      />
      <CWButton
        label="Send transaction"
        onClick={(e) => {
          e.preventDefault();

          setProposer(app.user?.activeAccount?.address);

          if (!proposer) {
            throw new Error('Invalid address / not logged in');
          }

          if (!description) {
            throw new Error('Invalid description');
          }

          const targets = [];
          const values = [];
          const calldatas = [];
          const signatures = [];

          for (let i = 0; i < tabCount; i++) {
            const aaveProposal = aaveProposalState[i];
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

          if (title) {
            setDescription(
              JSON.stringify({
                description,
                title,
              })
            );
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
            })
            .catch((err) => notifyError(err.data?.message || err.message));
        }}
      />
    </div>
  );
};
