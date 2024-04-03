import { utils } from 'ethers';
import React, { useEffect, useState } from 'react';

import { useBrowserAnalyticsTrack } from 'client/scripts/hooks/useBrowserAnalyticsTrack';
import { notifyError } from 'controllers/app/notifications';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import { AaveExecutor } from 'controllers/chain/ethereum/aave/api';
import type { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import 'pages/new_proposal/aave_proposal_form.scss';
import app from 'state';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { User } from 'views/components/user/user';
import { MixpanelGovernanceEvents } from '../../../../../shared/analytics/types';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import type { AaveProposalState } from './types';
import { defaultStateItem } from './types';

export const AaveProposalForm = () => {
  const [aaveProposalState, setAaveProposalState] = useState<
    Array<AaveProposalState>
  >([defaultStateItem]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [executor, setExecutor] = useState('');
  const [ipfsHash, setIpfsHash] = useState();
  const [proposer, setProposer] = useState('');
  const [tabCount, setTabCount] = useState(1);
  const [executorList, setExecutorList] = useState<AaveExecutor[]>([]);

  const author = app.user.activeAccount;
  const aave = app.chain as Aave;
  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  useEffect(() => {
    const getExecutors = async () => {
      const executors = await aave.governance.api.getAaveExecutors();
      setExecutorList(executors);
    };

    getExecutors();
  }, [aave.governance.api]);

  const updateAaveProposalState = <K extends keyof AaveProposalState>(
    index: number,
    key: K,
    value: AaveProposalState[K],
  ) => {
    const newAaveProposalState = [...aaveProposalState];
    newAaveProposalState[index][key] = value;
    setAaveProposalState(newAaveProposalState);
  };

  const handleSendTransaction = async (e) => {
    e.preventDefault();

    setProposer(app.user?.activeAccount?.address);

    if (!proposer) {
      throw new Error('Invalid address / not signed in');
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
      executor,
      targets,
      values,
      calldatas,
      signatures,
      withDelegateCalls,
      ipfsHash: _ipfsHash,
    };

    try {
      await aave.governance.propose(details);
      trackAnalytics({
        event: MixpanelGovernanceEvents.AAVE_PROPOSAL_CREATED,
      });
    } catch (err) {
      notifyError(err.data?.message || err.message);
    }
  };

  return (
    <div className="AaveProposalForm">
      <div className="row-with-label">
        <CWLabel label="Proposer (you)" />
        <User
          userAddress={author.address}
          userCommunityId={author.community?.id || author.profile?.chain}
          shouldLinkProfile
          shouldShowPopover
          shouldShowAddressWithDisplayName
        />
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
          {executorList.map((r) => (
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
        <CWTabsRow>
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
        </CWTabsRow>
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
                  (_, i) => i !== aaveProposalState.length - 1,
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
          updateAaveProposalState(activeTabIndex, 'target', e.target.value);
        }}
      />
      <CWTextInput
        label="Value"
        placeholder="Enter amount in wei"
        value={aaveProposalState[activeTabIndex].value}
        onInput={(e) => {
          updateAaveProposalState(activeTabIndex, 'value', e.target.value);
        }}
      />
      <CWTextInput
        label="Calldata"
        placeholder="Add Calldata"
        value={aaveProposalState[activeTabIndex].calldata}
        onInput={(e) => {
          updateAaveProposalState(activeTabIndex, 'calldata', e.target.value);
        }}
      />
      <CWTextInput
        label="Function Signature (Optional)"
        placeholder="Add a signature"
        value={aaveProposalState[activeTabIndex].signature}
        onInput={(e) => {
          updateAaveProposalState(activeTabIndex, 'signature', e.target.value);
        }}
      />
      <CWCheckbox
        checked={aaveProposalState[activeTabIndex].withDelegateCall}
        onChange={(e) => {
          updateAaveProposalState(
            activeTabIndex,
            'withDelegateCall',
            e.target.checked,
          );
        }}
        label="Delegate Call"
        value=""
      />
      <CWButton label="Send transaction" onClick={handleSendTransaction} />
    </div>
  );
};
