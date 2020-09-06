/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

const getValidatorNamesAndAddresses = async (models, req: Request, res: Response, next: NextFunction) => {

    try {
        //fetch address of validators
        let validators = await models.Validators.findAll({
            attributes: ['stash'],
        });
        let validatorAddresses = validators.map(obj => obj.stash);

        //fetch address of validators
        let profile = await models.OffchainProfile.findAll({
            attributes: ['data'],
            include: [{
                model: models.Address,
                attributes: ['address'],
                where: {
                    address: {
                        [Op.in]: validatorAddresses,
                    }
                },
                required: true,
            }]
        });

        const profileData = profile?.map(element => {
            element.data = JSON.parse(element.data);
            let setProfile = { name: element.data.name, address: element.Address?.address };
            return setProfile;
        });
        //set names of corresponding addresses in validators
        let validatorsObj: any = [];
        for (let profile of profileData) {
            for (let address of validatorAddresses) {
                if (profile.Address?.address == address) {
                    validatorsObj.push({
                        name: profile.data?.name,
                        stash: address
                    })
                }
            }
        }
        console.log("validatorsObj", validatorsObj);

        //update names on validators in validators model
        for (let obj of validatorsObj) {
            await models.Validators.update(
                {
                    name: obj.name
                },
                {
                    where: {
                        stash: obj.stash
                    },
                });
        }
        if (!profile) return next('No Offchain Profiles found');
        return res.json({
            status: 'Success',
            result: profileData
        });
    }

    catch (e) {
        console.log(e)
        return res.json({
            status: 'Success',
            result: []
        });
    }
};

export default getValidatorNamesAndAddresses;
