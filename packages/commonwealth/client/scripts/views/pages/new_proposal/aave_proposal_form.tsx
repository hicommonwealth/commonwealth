import React, { useState } from 'react';
import { utils } from 'ethers';

import 'pages/new_proposal/aave_proposal_form.scss';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import type { AaveProposalState } from './types';
import { defaultStateItem } from './types';
import type { Executor } from 'common-common/src/eth/types';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import type { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import { notifyError } from 'controllers/app/notifications';

export const AaveProposalForm = () => {
  const [aaveProposalState, setAaveProposalState] = useState<
    Array<AaveProposalState>
  >([defaultStateItem]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [executor, setExecutor] = useState<Executor | string>();
  const [ipfsHash, setIpfsHash] = useState();
  const [proposer, setProposer] = useState('');
  const [tabCount, setTabCount] = useState(1);

  const author = app.user.activeAccount;
  const aave = app.chain as Aave;

  return (
    <div className="AaveProposalForm">
      <div className="row-with-label">
        <CWLabel label="Proposer (you)" />
        <User user={author} linkify popover showAddressWithDisplayName />
      </div>
      <CWTextInput
        label="IPFS Hash"
        placeholder="Proposal IPFS Hash"
        onInput={(e) => {
          setIpfsHash(e.target.value);
        }}
      />
      <div className="row-with-label">
        <CWLabel label="Executor" />
        <div className="executors-container">
          {aave.governance.api.Executors.map((r) => (
            <div
              key={r.address}
              className={`executor ${
                executor === r.address && 'selected-executor'
              }`}
              onClick={() => {
                setExecutor(r.address);
              }}
            >
              <div className="executor-row">
                <CWText fontWeight="medium">Address</CWText>
                <CWText type="caption" noWrap>
                  {r.address}
                </CWText>
              </div>
              <div className="executor-row">
                <CWText fontWeight="medium">Time Delay</CWText>
                <CWText type="caption">
                  {r.delay / (60 * 60 * 24)} Day(s)
                </CWText>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="tab-selector">
        <CWTabBar>
          {aaveProposalState.map((_, index) => (
            <CWTab
              key={`Call ${index + 1}`}
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
              disabled: activeTabIndex === 0,
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
      <CWCheckbox
        checked={aaveProposalState[activeTabIndex].withDelegateCall}
        onChange={() => {
          aaveProposalState[activeTabIndex].withDelegateCall =
            !aaveProposalState[activeTabIndex].withDelegateCall;
        }}
        label="Delegate Call"
        value=""
      />
      <CWButton
        label="Send transaction"
        onClick={(e) => {
          e.preventDefault();

          setProposer(app.user?.activeAccount?.address);

          if (!proposer) {
            throw new Error('Invalid address / not logged in');
          }

          if (!executor) {
            throw new Error('Invalid executor');
          }

          if (!ipfsHash) {
            throw new Error('No ipfs hash');
          }

          const targets = [];
          const values = [];
          const calldatas = [];
          const signatures = [];
          const withDelegateCalls = [];

          for (let i = 0; i < tabCount; i++) {
            const aaveProposal = aaveProposalState[i];

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
          const _ipfsHash = utils.formatBytes32String(ipfsHash);

          const details: AaveProposalArgs = {
            executor: executor as string,
            targets,
            values,
            calldatas,
            signatures,
            withDelegateCalls,
            ipfsHash: _ipfsHash,
          };

          aave.governance
            .propose(details)
            .catch((err) => notifyError(err.data?.message || err.message));
        }}
      />
    </div>
  );
};
