import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB, sequelize } from '../database';
import { Errors } from "./verifyAddress";


const pinIPFS = async (models: DB, req: Request, res: Response, next: NextFunction) => {
        return res.json('Test request') ;
}

export default pinIPFS
