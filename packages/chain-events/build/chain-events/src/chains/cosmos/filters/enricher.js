"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrich = void 0;
const tx_1 = require("cosmjs-types/cosmos/gov/v1beta1/tx");
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
async function Enrich(api, blockNumber, kind, rawData) {
    switch (kind) {
        case types_1.EventKind.SubmitProposal: {
            const submitProposal = tx_1.MsgSubmitProposal.decode(rawData.message.value);
            // query all proposals and locate the most recent one matching the tx
            // TODO: is there an easier way to do this involving MsgSubmitProposalResponse?
            //   basically, the data we need is the proposal id.
            const { proposals } = await api.lcd.gov.proposals(0, '', '');
            const proposal = proposals.find((p) => {
                if (p.content.typeUrl !== submitProposal.content.typeUrl)
                    return false;
                return Buffer.from(p.content.value).equals(Buffer.from(submitProposal.content.value));
            });
            const dateToUnix = (d) => {
                if (d)
                    return Math.floor(d.getTime() / 1000);
                return undefined;
            };
            if (!proposal)
                throw new Error('Proposal not found!');
            return {
                blockNumber,
                network: interfaces_1.SupportedNetwork.Cosmos,
                data: {
                    kind,
                    id: proposal.proposalId.toString(10),
                    proposer: submitProposal.proposer,
                    content: {
                        typeUrl: proposal.content.typeUrl,
                        value: Buffer.from(proposal.content.value).toString('hex'),
                    },
                    submitTime: dateToUnix(proposal.submitTime),
                    depositEndTime: dateToUnix(proposal.depositEndTime),
                    votingStartTime: dateToUnix(proposal.votingStartTime),
                    votingEndTime: dateToUnix(proposal.votingEndTime),
                },
            };
        }
        case types_1.EventKind.Deposit: {
            const deposit = tx_1.MsgDeposit.decode(rawData.message.value);
            return {
                blockNumber,
                network: interfaces_1.SupportedNetwork.Cosmos,
                data: {
                    kind,
                    id: deposit.proposalId.toString(10),
                    depositor: deposit.depositor,
                    amount: (0, types_1.coinToCoins)(deposit.amount),
                },
            };
        }
        case types_1.EventKind.Vote: {
            const vote = tx_1.MsgVote.decode(rawData.message.value);
            return {
                blockNumber,
                network: interfaces_1.SupportedNetwork.Cosmos,
                data: {
                    kind,
                    id: vote.proposalId.toString(10),
                    voter: vote.voter,
                    option: vote.option,
                },
            };
        }
        default: {
            throw new Error(`Unknown event kind: ${kind}`);
        }
    }
}
exports.Enrich = Enrich;
