import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';

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
    </div>
  );
};

export default SnapshotSpaceSelectorModal;
