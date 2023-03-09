import {Request, Response } from 'express';
import { govCompGetVotes, govCompVote } from '../types';
import { compoundGovernor } from '../utils/governance/compoundGov';

export const createProposal = 
    async(req: Request, res: Response) => {
    const gov = new compoundGovernor()
    const id = await gov.createArbitraryProposal(3);
    res.status(200).json(id).send()
}

export const cancelProposal =
    async(req: Request, res: Response) => {
    const gov = new compoundGovernor()
    const id = await gov.cancelProposal(req.body.proposalId);
    res.status(200).json(id).send()
}
export const getVotes = async (req: Request, res: Response) => {
    const request: govCompGetVotes = req.body
    const gov = new compoundGovernor()
    await gov.getVotes(request.accountIndex, request.numberOfVotes);
    res.status(200).send()
}
export const castVote = async (req: Request, res: Response) => {
    const request: govCompVote = req.body
    const gov = new compoundGovernor()
    await gov.castVote(request.proposalId, request.accountIndex, request.forAgainst)
    res.status(200).send()
}

export const queueProposal = async (req: Request, res: Response) => {
    const gov = new compoundGovernor()
    await gov.queueProposal(req.body.proposalId, true)
    res.status(200).send()
}

export const executeProposal = async (req: Request, res: Response) => {
    const gov = new compoundGovernor()
    await gov.executeProposal(req.body.proposalId, true)
    res.status(200).send()
}

export const runFullCycle = async (req: Request, res: Response) => {
    const gov = new compoundGovernor()
    await gov.endToEndSim()
    res.status(200).send()
}

export const getProposalDetails =
 async (req: Request, res: Response) => {
    const gov = new compoundGovernor()
    const details = await gov.getProposalDetails(req.body.proposalId)
    res.status(200).json(details).send()
}

//Implement each of these Queue -> cancel: https://docs.compound.finance/v2/governance/