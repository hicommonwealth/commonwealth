/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

const getValidatorNamesAndAddresses = async (models, req: Request, res: Response, next: NextFunction) => {

    try {
        //fetch address of validators
        let validators = await models.Validators.findAll({
            attributes: ['stash_id', 'state'],
        });
        // console.log(validators, "validators")

        let validatorAddresses = validators.map(obj => {
            return {
                stash_id: obj.stash_id,
                state: obj.state
            }
        });
        // console.log(validatorAddresses, "validatorAddresses");
        //fetch address of validators
        let profile = await models.OffchainProfile.findAll({
            attributes: ['data'],
            include: [{
                model: models.Address,
                attributes: ['address'],
                where: {
                    address: {
                        [Op.in]: validators.map(obj => obj.stash_id)
                    }
                },
                required: true,
            }]
        });

        const profileData = profile?.map(element => {
            element.data = JSON.parse(element.data);
            let { state } = validatorAddresses.find((obj) => obj.stash_id === element.Address?.address);
            let setProfile = {
                name: element.data.name,
                address: element.Address?.address,
                state
            };
            return setProfile;
        });

        //set names of corresponding addresses in validators
        for (let profile of profileData) {
            for (let address of validatorAddresses) {
                // console.log("profile ", profile)
                if (profile.address === address.stash_id) {
                    await models.Validators.update(
                        {
                            name: profile.name
                        },
                        {
                            where: {
                                stash_id: address.stash_id
                            },
                        }
                    );
                }
            }
        }

        if (!profile) return next('No Offchain Profiles found');
        return res.json({
            status: 'Success',
            total: profileData.length,
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
