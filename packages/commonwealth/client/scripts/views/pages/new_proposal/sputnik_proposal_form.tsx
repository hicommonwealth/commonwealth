/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { SupportedSputnikProposalTypes } from './types';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';

export class SputnikProposalForm extends ClassComponent {
  private description;
  private member;
  private payoutAmount;
  private sputnikProposalType;
  private tokenId;

  oninit() {
    this.sputnikProposalType = SupportedSputnikProposalTypes.AddMemberToRole;
  }

  view() {
    return (
      <>
        <CWDropdown
          label="Proposal Type"
          defaultValue={SupportedSputnikProposalTypes.AddMemberToRole}
          options={Object.values(SupportedSputnikProposalTypes).map((v) => ({
            name: 'proposalType',
            label: v,
            value: v,
          }))}
          onSelect={(result) => {
            this.sputnikProposalType = result;
            m.redraw();
          }}
        />
        {this.sputnikProposalType !== SupportedSputnikProposalTypes.Vote && (
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
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
