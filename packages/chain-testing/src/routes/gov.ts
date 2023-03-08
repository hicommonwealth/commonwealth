import {Request, Response } from 'express';
import { compoundGovernor } from '../utils/governance/compoundGov';

export const createProposal = 
    async(req: Request, res: Response) => {
    const gov = new compoundGovernor()
    await gov.createArbitraryProposal();
    res.status(200).send()
}

//Implement each of these Queue -> cancel: https://docs.compound.finance/v2/governance/