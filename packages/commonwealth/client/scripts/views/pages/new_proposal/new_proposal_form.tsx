/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import app from 'state';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { Topic } from 'models';
import { formatCoin } from 'adapters/currency';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import Substrate from 'controllers/chain/substrate/adapter';
import Cosmos from 'controllers/chain/cosmos/adapter';
import User from 'views/components/widgets/user';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import ErrorPage from 'views/pages/error';
import { TopicSelector } from 'views/components/topic_selector';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { createNewProposal } from './helpers';
import {
  SupportedCosmosProposalTypes,
  SupportedSputnikProposalTypes,
} from './types';
import { AaveProposalForm } from './aave_proposal_form';

type NewProposalFormAttrs = {
  onChangeSlugEnum: (slug: any) => void;
  typeEnum: ProposalType;
};

// this should be titled the Substrate/Edgeware new proposal form
export class NewProposalForm extends ClassComponent<NewProposalFormAttrs> {
  private aaveProposalState;
  private aaveTabCount;
  private activeAaveTabIndex;
  private applicantAddress;
  private cosmosProposalType;
  private councilMotionDescription;
  private councilMotionType;
  private deposit;
  private description;
  private enactmentDelay;
  private form: {
    amount;
    beneficiary;
    description;
    reason;
    title;
    topicId;
    topicName;
    value;
  };
  private member;
  private nextExternalProposalHash;
  private payoutAmount;
  private proposer;
  private recipient;
  private referendumId;
  private sharesRequested;
  private sputnikProposalType;
  private threshold;
  private title;
  private toggleValue;
  private tokenId;
  private tokenTribute;
  private treasuryProposalIndex;
  private votingPeriod;

  oncreate() {
    this.toggleValue = 'proposal';
  }

  oninit() {
    this.aaveTabCount = 1;
    this.activeAaveTabIndex = 0;
    this.aaveProposalState = [
      {
        target: null,
        value: null,
        calldata: null,
        signature: null,
        withDelegateCall: false,
      },
    ];
    this.cosmosProposalType = SupportedCosmosProposalTypes.Text;
    this.sputnikProposalType = SupportedSputnikProposalTypes.AddMemberToRole;
  }

  view(vnode: m.Vnode<NewProposalFormAttrs>) {
    const { onChangeSlugEnum, typeEnum } = vnode.attrs;

    const author = app.user.activeAccount;

    if (!author) {
      return <CWText>Must be logged in</CWText>;
    }

    if (app.chain?.network === ChainNetwork.Plasm) {
      return <CWText>Unsupported network</CWText>;
    }

    // check typeEnum against supported types (use Omit on ProposalType?)

    // unsupported?
    // MolochProposal = 'molochproposal',
    // SubstrateDemocracyReferendum = 'referendum',
    // SubstrateImminentPreimage = 'democracyimminent',
    // SubstratePreimage = 'democracypreimage',
    // SubstrateTechnicalCommitteeMotion = 'technicalcommitteemotion',
    // Thread = 'discussion',

    // supported?
    // AaveProposal = 'onchainproposal',
    // CompoundProposal = 'compoundproposal',
    // CosmosProposal = 'cosmosproposal',
    // PhragmenCandidacy = 'phragmenelection',
    // SputnikProposal = 'sputnikproposal',
    // SubstrateBountyProposal = 'bountyproposal',
    // SubstrateCollectiveProposal = 'councilmotion',
    // SubstrateDemocracyProposal = 'democracyproposal',
    // SubstrateTreasuryProposal = 'treasuryproposal',
    // SubstrateTreasuryTip = 'treasurytip',

    // else {
    //   return <div class="NewProposalForm">Invalid proposal type</div>;
    // }

    let hasAction: boolean;
    let hasDepositChooser: boolean;
    // council motion
    let hasExternalProposalSelector: boolean;
    // data loaded
    let dataLoaded = true;

    if (typeEnum === ProposalType.SubstrateDemocracyProposal) {
      hasAction = true;
      hasDepositChooser = this.toggleValue === 'proposal';

      if (hasDepositChooser) {
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
      }
    } else if (typeEnum === ProposalType.SubstrateCollectiveProposal) {
      hasAction =
        this.councilMotionType === 'createExternalProposal' ||
        this.councilMotionType === 'createExternalProposalMajority';

      hasExternalProposalSelector =
        this.councilMotionType === 'vetoNextExternal' ||
        this.councilMotionType === 'createFastTrack' ||
        this.councilMotionType === 'createExternalProposalDefault';

      if (hasExternalProposalSelector) {
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
      }
    } else if (typeEnum === ProposalType.SubstrateTreasuryProposal) {
      const treasury = (app.chain as Substrate).treasury;

      dataLoaded = !!treasury.initialized;
    } else if (typeEnum === ProposalType.SubstrateBountyProposal) {
      const bountyTreasury = (app.chain as Substrate).bounties;

      dataLoaded = !!bountyTreasury.initialized;
    } else if (typeEnum === ProposalType.SubstrateTreasuryTip) {
      // TODO: this is only true if the proposer is doing reportAwesome()
      //   we need special code for newTip().
      const tips = (app.chain as Substrate).tips;

      dataLoaded = !!tips.initialized;
    } else if (typeEnum === ProposalType.PhragmenCandidacy) {
      const elections = (app.chain as Substrate).phragmenElections;

      dataLoaded = !!elections.initialized;
    } else if (typeEnum === ProposalType.CosmosProposal) {
      dataLoaded = !!(app.chain as Cosmos).governance.initialized;
    }

    if (
      hasAction &&
      !(app.user.activeAccount as SubstrateAccount).isCouncillor
    ) {
      dataLoaded = false;
    }

    // default state options
    const motions = SubstrateCollectiveProposal.motions;

    if (!this.councilMotionType) {
      this.councilMotionType = motions[0].name;
      this.councilMotionDescription = motions[0].description;
    }

    if (!dataLoaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    const { activeAaveTabIndex, aaveProposalState } = this;

    return (
      <>
        {typeEnum === ProposalType.SubstrateCollectiveProposal && (
          <>
            <CWDropdown
              label="Motion"
              options={motions.map((m_) => ({
                name: 'councilMotionType',
                value: m_.name,
                label: m_.label,
              }))}
              onSelect={(result) => {
                this.councilMotionType = result;
                this.councilMotionDescription = motions.find(
                  (m_) => m_.name === result
                ).description;
                m.redraw();
              }}
            />
            {this.councilMotionDescription && (
              <div class="council-motion-description">
                {this.councilMotionDescription}
              </div>
            )}
          </>
        )}
        {hasAction && m(EdgewareFunctionPicker)}
        {typeEnum === ProposalType.Thread && (
          <TopicSelector
            topics={app.topics.getByCommunity(app.chain.id)}
            updateFormData={(topic: Topic) => {
              this.form.topicName = topic.name;
              this.form.topicId = topic.id;
            }}
          />
        )}
        {typeEnum === ProposalType.SubstrateBountyProposal && (
          <CWTextInput
            placeholder="Bounty title (stored on chain)"
            label="Title"
            oninput={(e) => {
              const result = (e.target as any).value;
              this.form.title = result;
              m.redraw();
            }}
          />
        )}
        {typeEnum === ProposalType.Thread && (
          <>
            <CWTextInput
              placeholder="Enter a title"
              label="Title"
              oninput={(e) => {
                const result = (e.target as any).value;
                this.form.title = result;
                m.redraw();
              }}
            />
            <CWTextArea
              label="Description"
              placeholder="Enter a description"
              oninput={(e) => {
                const result = (e.target as any).value;
                if (this.form.description !== result) {
                  this.form.description = result;
                }
                m.redraw();
              }}
            />
          </>
        )}
        {typeEnum === ProposalType.SubstrateTreasuryProposal && (
          <CWTextInput
            title="Beneficiary"
            placeholder="Beneficiary of proposal"
            defaultValue={author.address}
            oncreate={() => {
              this.form.beneficiary = author.address;
            }}
            oninput={(e) => {
              const result = (e.target as any).value;
              this.form.beneficiary = result;
              m.redraw();
            }}
          />
        )}
        {typeEnum === ProposalType.SubstrateTreasuryProposal && (
          <>
            <CWTextInput
              label={`Amount (${app.chain.chain.denom})`}
              placeholder="Amount of proposal"
              oninput={(e) => {
                const result = (e.target as any).value;
                this.form.amount = app.chain.chain.coins(
                  parseFloat(result),
                  true
                );
                m.redraw();
              }}
            />
            <CWText>
              Bond:{' '}
              {app.chain.chain
                .coins(
                  Math.max(
                    (this.form.amount?.inDollars || 0) *
                      (app.chain as Substrate).treasury.bondPct,
                    (app.chain as Substrate).treasury.bondMinimum.inDollars
                  ),
                  true
                )
                .format()}
              {(app.chain as Substrate).treasury.bondPct * 100}% of requested
              amount minimum{' '}
              {(app.chain as Substrate).treasury.bondMinimum.format()}
            </CWText>
          </>
        )}
        {typeEnum === ProposalType.PhragmenCandidacy && (
          <div class="council-slot-info">
            Becoming a candidate requires a deposit of
            {formatCoin(
              (app.chain as Substrate).phragmenElections.candidacyBond
            )}
            . It will be returned if you are elected, or carried over to the
            next election if you are in the top{' '}
            {(app.chain as Substrate).phragmenElections.desiredRunnersUp}{' '}
            runners-up.
          </div>
        )}
        {typeEnum === ProposalType.SubstrateDemocracyProposal && (
          <CWRadioGroup
            name="democracy-tx-switcher"
            onchange={async (value) => {
              this.toggleValue = value;
              onChangeSlugEnum(value);
              m.redraw();
            }}
            toggledOption="proposal"
            options={[
              { label: 'Create Proposal', value: 'proposal' },
              { label: 'Upload Preimage', value: 'preimage' },
              {
                label: 'Upload Imminent Preimage',
                value: 'imminent',
              },
            ]}
          />
        )}
        {typeEnum === ProposalType.SubstrateBountyProposal && (
          <CWTextInput
            label={`Value (${app.chain.chain.denom})`}
            placeholder="Amount allocated to bounty"
            oninput={(e) => {
              const result = (e.target as any).value;
              this.form.value = app.chain.chain.coins(parseFloat(result), true);
              m.redraw();
            }}
          />
        )}
        {hasDepositChooser && (
          <CWTextInput
            label={`Deposit (${
              app.chain.base === ChainBase.Substrate
                ? app.chain.currency
                : (app.chain as Cosmos).governance.minDeposit.denom
            })`}
            placeholder={`Min: ${
              app.chain.base === ChainBase.Substrate
                ? (app.chain as Substrate).democracyProposals.minimumDeposit
                    .inDollars
                : +(app.chain as Cosmos).governance.minDeposit
            }`}
            oncreate={(vvnode) =>
              $(vvnode.dom).val(
                app.chain.base === ChainBase.Substrate
                  ? (app.chain as Substrate).democracyProposals.minimumDeposit
                      .inDollars
                  : +(app.chain as Cosmos).governance.minDeposit
              )
            }
            oninput={(e) => {
              const result = (e.target as any).value;
              this.deposit = parseFloat(result);
              m.redraw();
            }}
          />
        )}
        {this.councilMotionType === 'createFastTrack' ||
          (this.councilMotionType === 'createExternalProposalDefault' && (
            <>
              <CWTextInput
                label="Voting Period"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.votingPeriod = +result;
                  m.redraw();
                }}
              />
              <CWTextInput
                label="Enactment Delay"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.enactmentDelay = +result;
                  m.redraw();
                }}
              />
            </>
          ))}
        {this.councilMotionType === 'createEmergencyCancellation' && (
          <CWDropdown
            label="Referendum"
            options={(app.chain as Substrate).democracy.store
              .getAll()
              .map((r) => ({
                name: 'referendum',
                value: r.identifier,
                label: `${r.shortIdentifier}: ${r.title}`,
              }))}
            onSelect={(result) => {
              this.referendumId = result;
              m.redraw();
            }}
          />
        )}
        {/* {hasExternalProposalSelector &&
          (app.chain as Substrate).democracyProposals.nextExternal && (
            <CWDropdown
              label="Proposal"
              options={{
                value: (
                  app.chain as Substrate
                ).democracyProposals.nextExternal[0].hash.toString(),
                label: `${(
                  app.chain as Substrate
                ).democracyProposals.nextExternal[0].hash
                  .toString()
                  .slice(0, 8)}...`,
              }}
              onSelect={(result) => {
                this.nextExternalProposalHash = result;
                m.redraw();
              }}
            />
          )} */}
        {this.councilMotionType === 'createTreasuryApprovalMotion' ||
          (this.councilMotionType === 'createTreasuryRejectionMotion' && (
            <CWDropdown
              label="Treasury Proposal"
              options={(app.chain as Substrate).treasury.store
                .getAll()
                .map((r) => ({
                  name: 'external_proposal',
                  value: r.identifier,
                  label: r.shortIdentifier,
                }))}
              onSelect={(result) => {
                this.treasuryProposalIndex = result;
                m.redraw();
              }}
            />
          ))}
        {this.councilMotionType !== 'vetoNextExternal' && (
          <CWTextInput
            label="Threshold"
            placeholder="How many members must vote yes to execute?"
            oninput={(e) => {
              const result = (e.target as any).value;
              this.threshold = +result;
              m.redraw();
            }}
          />
        )}
        {typeEnum === ProposalType.CompoundProposal && (
          <div class="AaveGovernance">
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
                    isSelected={activeAaveTabIndex === index}
                    onclick={() => {
                      this.activeAaveTabIndex = index;
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
                      this.aaveTabCount++;
                      this.activeAaveTabIndex = this.aaveTabCount - 1;
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
                    onclick: () => {
                      this.aaveTabCount--;
                      this.activeAaveTabIndex = this.aaveTabCount - 1;
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
              value={aaveProposalState[activeAaveTabIndex].target}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.aaveProposalState[activeAaveTabIndex].target = result;
                m.redraw();
              }}
            />
            <CWTextInput
              label="Value"
              placeholder="Enter amount in wei"
              value={aaveProposalState[activeAaveTabIndex].value}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.aaveProposalState[activeAaveTabIndex].value = result;
                m.redraw();
              }}
            />
            <CWTextInput
              label="Calldata"
              placeholder="Add Calldata"
              value={aaveProposalState[activeAaveTabIndex].calldata}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.aaveProposalState[activeAaveTabIndex].calldata = result;
                m.redraw();
              }}
            />
            <CWTextInput
              label="Function Signature (Optional)"
              placeholder="Add a signature"
              value={aaveProposalState[activeAaveTabIndex].signature}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.aaveProposalState[activeAaveTabIndex].signature = result;
                m.redraw();
              }}
            />
          </div>
        )}
        {typeEnum === ProposalType.AaveProposal && (
          <AaveProposalForm author={author} />
        )}
        {typeEnum === ProposalType.SputnikProposal && (
          <>
            <CWDropdown
              label="Proposal Type"
              defaultValue={SupportedSputnikProposalTypes.AddMemberToRole}
              options={Object.values(SupportedSputnikProposalTypes).map(
                (v) => ({
                  name: 'proposalType',
                  label: v,
                  value: v,
                })
              )}
              onSelect={(result) => {
                this.sputnikProposalType = result;
                m.redraw();
              }}
            />
            {this.sputnikProposalType !==
              SupportedSputnikProposalTypes.Vote && (
              <CWTextInput
                label="Member"
                defaultValue="tokenfactory.testnet"
                // oncreate={() => {
                //   this.member = 'tokenfactory.testnet';
                // }}
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.member = result;
                  m.redraw();
                }}
              />
            )}
            <CWTextInput
              label="Description"
              // defaultValue=''
              // oncreate={() => {
              //   this.description = '';
              // }}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.description = result;
                m.redraw();
              }}
            />
            {this.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer && (
              <CWTextInput
                label="Token ID (leave blank for Ⓝ)"
                // defaultValue: '',
                // oncreate: () => {
                //   this.tokenId = '';
                // },
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.tokenId = result;
                  m.redraw();
                }}
              />
            )}
            {this.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer && (
              <CWTextInput
                label="Amount"
                // defaultValue: '',
                // oncreate: () => {
                //   this.payoutAmount = '';
                // },
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.payoutAmount = result;
                  m.redraw();
                }}
              />
            )}
          </>
        )}
        {typeEnum === ProposalType.CosmosProposal && (
          <>
            <CWDropdown
              label="Proposal Type"
              initialValue={SupportedCosmosProposalTypes.Text}
              options={Object.values(SupportedCosmosProposalTypes).map((v) => ({
                name: 'proposalType',
                label: v,
                value: v,
              }))}
              onSelect={(result) => {
                this.cosmosProposalType = result;
                m.redraw();
              }}
            />
            <CWTextInput
              placeholder="Enter a title"
              label="Title"
              oninput={(e) => {
                const result = (e.target as any).value;
                this.form.title = result;
                m.redraw();
              }}
            />
            <CWTextArea
              label="Description"
              placeholder="Enter a description"
              oninput={(e) => {
                const result = (e.target as any).value;
                if (this.form.description !== result) {
                  this.form.description = result;
                }
                m.redraw();
              }}
            />
            <CWTextInput
              label={`Deposit (${
                (app.chain as Cosmos).governance.minDeposit.denom
              })`}
              placeholder={`Min: ${+(app.chain as Cosmos).governance
                .minDeposit}`}
              // oncreate={(vvnode) =>
              //   $(vvnode.dom).val(
              //     +(app.chain as Cosmos).governance.minDeposit
              //   )}
              oninput={(e) => {
                const result = (e.target as any).value;
                this.deposit = +result;
                m.redraw();
              }}
            />
            {this.cosmosProposalType !== SupportedCosmosProposalTypes.Text && (
              <CWTextInput
                label="Recipient"
                placeholder={app.user.activeAccount.address}
                // defaultValue: '',
                // oncreate: () => {
                //   this.recipient = '';
                // },
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.recipient = result;
                  m.redraw();
                }}
              />
            )}
            {this.cosmosProposalType !== SupportedCosmosProposalTypes.Text && (
              <CWTextInput
                label={`Amount (${
                  (app.chain as Cosmos).governance.minDeposit.denom
                })`}
                placeholder="12345"
                // defaultValue: '',
                // oncreate: () => {
                //   this.payoutAmount = '';
                // },
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.payoutAmount = result;
                  m.redraw();
                }}
              />
            )}
          </>
        )}
        {typeEnum === ProposalType.SubstrateTreasuryTip && (
          <>
            <CWLabel label="Finder" />,
            {m(User, {
              user: author,
              linkify: true,
              popover: true,
              showAddressWithDisplayName: true,
            })}
            <CWTextInput
              label="Beneficiary"
              placeholder="Beneficiary of treasury proposal"
              oninput={(e) => {
                const result = (e.target as any).value;
                this.form.beneficiary = result;
                m.redraw();
              }}
            />
            <CWTextArea
              label="Reason"
              placeholder="What’s the reason you want to tip the beneficiary?"
              oninput={(e) => {
                const result = (e.target as any).value;
                if (this.form.description !== result) {
                  this.form.description = result;
                }
                m.redraw();
              }}
            />
          </>
        )}
        <CWButton
          disabled={
            typeEnum === ProposalType.SubstrateCollectiveProposal &&
            !(author as SubstrateAccount).isCouncillor
          }
          label={
            typeEnum === ProposalType.Thread
              ? 'Create thread'
              : 'Send transaction'
          }
          onclick={(e) => {
            e.preventDefault();
            createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
