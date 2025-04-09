import React from 'react';

import type Thread from '../../models/Thread';

import { Link } from 'models/Thread';
import { ProposalState } from '../components/NewThreadFormModern/NewThreadForm';
import { NoThreadUpdateProposalStatusModal } from './NoThreadUpdateProposalStatusModal';
import { ThreadUpdateProposalStatusModal } from './ThreadUpdateProposalStatusModal';
import './UpdateProposalStatusModal.scss';

type UpdateProposalStatusModalProps = {
  onChangeHandler?: (stage: string, links?: Link[]) => void;
  onModalClose: () => void;
  thread: Thread | null;
  snapshotProposalConnected?: boolean;
  initialSnapshotLinks?: Link[];
  setLinkedProposals?: React.Dispatch<React.SetStateAction<ProposalState>>; // State setter for proposals
  linkedProposals?: ProposalState | null;
};

export const UpdateProposalStatusModal = ({
  onChangeHandler,
  onModalClose,
  thread,
  snapshotProposalConnected,
  initialSnapshotLinks,
  setLinkedProposals,
  linkedProposals,
}: UpdateProposalStatusModalProps) => {
  console.log({ linkedProposals });

  return thread ? (
    <ThreadUpdateProposalStatusModal
      onChangeHandler={onChangeHandler}
      onModalClose={onModalClose}
      thread={thread}
      snapshotProposalConnected={snapshotProposalConnected}
      initialSnapshotLinks={initialSnapshotLinks}
    />
  ) : (
    <NoThreadUpdateProposalStatusModal
      onModalClose={onModalClose}
      setLinkedProposals={setLinkedProposals}
      linkedProposals={linkedProposals}
    />

    // <div className="UpdateProposalStatusModal">
    //   <CWModalHeader
    //     label="Update proposal status"
    //     onModalClose={onModalClose}
    //   />
    //   <CWModalBody allowOverflow>
    //     {showSnapshot ? (
    //       <>
    //         <SelectList
    //           defaultValue={
    //             tempStage
    //               ? { value: tempStage, label: threadStageToLabel(tempStage) }
    //               : null
    //           }
    //           placeholder="Select a stage"
    //           isSearchable={false}
    //           options={stages.map((stage) => ({
    //             value: stage as unknown as ThreadStage,
    //             label: threadStageToLabel(stage),
    //           }))}
    //           className="StageSelector"
    //           // @ts-expect-error <StrictNullChecks/>
    //           onChange={(option) => setTempStage(option.value)}
    //         />
    //         <SnapshotProposalSelector
    //           onSelect={handleSelectProposal}
    //           snapshotProposalsToSet={tempSnapshotProposals}
    //         />
    //       </>
    //     ) : (
    //       !isCosmos && <CWText>Please connect your Snapshot space </CWText>
    //     )}
    //     {isCosmos && (
    //       <CosmosProposalSelector
    //         onSelect={handleSelectCosmosProposal}
    //         proposalsToSet={tempCosmosProposals}
    //       />
    //     )}
    //   </CWModalBody>
    //   <CWModalFooter>
    //     <div className="proposal-modal">
    //       <div className="left-button">
    //         {snapshotProposalConnected && (
    //           <CWButton
    //             label="Remove proposal"
    //             buttonType="destructive"
    //             buttonHeight="sm"
    //             onClick={handleRemoveProposalWrapper}
    //           />
    //         )}
    //       </div>
    //       <div className="right-buttons">
    //         <CWButton
    //           label="Cancel"
    //           buttonType="secondary"
    //           buttonHeight="sm"
    //           onClick={onModalClose}
    //         />
    //         <CWButton
    //           buttonType="primary"
    //           buttonHeight="sm"
    //           label="Save changes"
    //           onClick={handleSaveChanges}
    //         />
    //       </div>
    //     </div>
    //   </CWModalFooter>
    // </div>
  );
};
