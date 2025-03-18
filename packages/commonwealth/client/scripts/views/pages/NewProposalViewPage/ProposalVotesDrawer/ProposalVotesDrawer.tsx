import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'client/scripts/views/components/component_kit/new_designs/CWDrawer';
import { CWTableColumnInfo } from 'client/scripts/views/components/component_kit/new_designs/CWTable/CWTable';
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
const columns: CWTableColumnInfo[] = [
  {
    key: 'voter',
    header: 'User',
    numeric: false,
    sortable: true,
  },

  {
    key: 'choice',
    header: 'Vote',
    numeric: false,
    sortable: true,
  },
  {
    key: 'balance',
    header: 'balance',
    numeric: false,
    sortable: true,
  },
];
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
