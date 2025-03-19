import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'client/scripts/views/components/component_kit/new_designs/CWDrawer';
import React, { Dispatch, SetStateAction } from 'react';
import ProposalVotesTable from '../ProposalVotesTable/ProposalVotesTable';
import './ProposalVotesDrawer.scss';
type ProposalVotesDrawerProps = {
  header: string;
  votes: any[];
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  choices?: Array<string> | undefined;
};

const ProposalVotesDrawer = ({
  header,
  votes,
  choices,
  isOpen,
  setIsOpen,
}: ProposalVotesDrawerProps) => {
  return (
    <div className="ProposalVotesDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="upvote-drawer"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <CWDrawerTopBar onClose={() => setIsOpen(false)} />
        <div className="content-container">
          <CWText type="h3">{header}</CWText>
          <ProposalVotesTable votes={votes} choices={choices} />
        </div>
      </CWDrawer>
    </div>
  );
};

export default ProposalVotesDrawer;
