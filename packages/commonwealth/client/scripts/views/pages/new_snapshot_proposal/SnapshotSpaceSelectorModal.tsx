import React from 'react';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';

type SnapshotSpaceSelectorModalProps = {
  snapshotSpacesArray: string[];
  onModalClose: () => void;
  handleSpaceSelection: (space: string) => void;
};
const SnapshotSpaceSelectorModal = ({
  snapshotSpacesArray,
  onModalClose,
  handleSpaceSelection,
}: SnapshotSpaceSelectorModalProps) => {
  return (
    <div className="SnapshotSpaceSelectorModal">
      <CWModalHeader
        label="Please select a Snapshot space"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div>
          {snapshotSpacesArray.map((space, key) => (
            <CWButton
              label={space}
              key={key}
              onClick={() => handleSpaceSelection(space)}
            ></CWButton>
          ))}
        </div>
      </CWModalBody>
      <CWModalFooter> </CWModalFooter>
    </div>
  );
};

export default SnapshotSpaceSelectorModal;
