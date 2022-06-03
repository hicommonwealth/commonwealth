import m from 'mithril';
import MolochProposal from 'controllers/chain/ethereum/moloch/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import { notifyError } from 'controllers/app/notifications';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';

export const cancelProposal = (e, state, proposal, onModalClose) => {
  e.preventDefault();
  state.votingModalOpen = true;

  if (!onModalClose) {
    onModalClose = () => undefined;
  }
  if (proposal instanceof MolochProposal) {
    proposal
      .abortTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else if (proposal instanceof CompoundProposal) {
    proposal
      .cancelTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else if (proposal instanceof AaveProposal) {
    proposal
      .cancelTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else {
    state.votingModalOpen = false;
    return notifyError('Invalid proposal type');
  }
};
