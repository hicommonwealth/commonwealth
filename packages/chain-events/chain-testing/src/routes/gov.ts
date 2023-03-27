import { Request, Response } from 'express';
import {
  govCompCreate,
  govCompGetVotes,
  govCompProposalId,
  govCompVote,
} from '../types';
import { compoundGovernor } from '../utils/governance/compoundGov';
import { aaveGovernor } from '../utils/governance/aaveGov';
import { IGovernor } from '../utils/governance/IGovernor';

export const createProposal = async (req: Request, res: Response) => {
  try {
    const request: govCompCreate = req.body;
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    const id = await gov.createArbitraryProposal(request.accountIndex, 3);
    res.status(200).json(id).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    const id = await gov.cancelProposal(request.proposalId);
    res.status(200).json(id).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    await gov.getVotes(request.accountIndex, request.numberOfVotes);
    res.status(200).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    await gov.castVote(
      request.proposalId,
      request.accountIndex,
      request.forAgainst
    );
    res.status(200).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    await gov.queueProposal(request.proposalId, true);
    res.status(200).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    await gov.executeProposal(request.proposalId, true);
    res.status(200).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    await gov.endToEndSim();
    res.status(200).send();
  } catch (err) {
    console.error(err);
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
    const gov: IGovernor = req.originalUrl.includes('compound')
      ? new compoundGovernor()
      : new aaveGovernor();
    const details = await gov.getProposalDetails(request.proposalId);
    res.status(200).json(details).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
