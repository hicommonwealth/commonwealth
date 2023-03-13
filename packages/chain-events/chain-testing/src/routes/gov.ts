import { Request, Response } from 'express';
import { govCompGetVotes, govCompProposalId, govCompVote } from '../types';
import { compoundGovernor } from '../utils/governance/compoundGov';

export const createProposal = async (req: Request, res: Response) => {
  try {
    const gov = new compoundGovernor();
    const id = await gov.createArbitraryProposal(3);
    res.status(200).json(id).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const cancelProposal = async (req: Request, res: Response) => {
  try {
    const request: govCompProposalId = req.body;
    const gov = new compoundGovernor();
    const id = await gov.cancelProposal(request.proposalId);
    res.status(200).json(id).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
export const getVotes = async (req: Request, res: Response) => {
  try {
    const request: govCompGetVotes = req.body;
    const gov = new compoundGovernor();
    await gov.getVotes(request.accountIndex, request.numberOfVotes);
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
export const castVote = async (req: Request, res: Response) => {
  try {
    const request: govCompVote = req.body;
    const gov = new compoundGovernor();
    await gov.castVote(
      request.proposalId,
      request.accountIndex,
      request.forAgainst
    );
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const queueProposal = async (req: Request, res: Response) => {
  try {
    const request: govCompProposalId = req.body;
    const gov = new compoundGovernor();
    await gov.queueProposal(request.proposalId, true);
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const executeProposal = async (req: Request, res: Response) => {
  try {
    const request: govCompProposalId = req.body;
    const gov = new compoundGovernor();
    await gov.executeProposal(request.proposalId, true);
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const runFullCycle = async (req: Request, res: Response) => {
  try {
    const gov = new compoundGovernor();
    await gov.endToEndSim();
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const getProposalDetails = async (req: Request, res: Response) => {
  try {
    const request: govCompProposalId = req.body;
    const gov = new compoundGovernor();
    const details = await gov.getProposalDetails(request.proposalId);
    res.status(200).json(details).send();
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
