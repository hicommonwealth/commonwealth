/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

const getValidatorNamesAndAddresses = async (models, req: Request, res: Response, next: NextFunction) => {
  try {
    // fetch address of validators
    const validators = await models.Validator.findAll({
      attributes: ['stash', 'state'],
    });
    // console.log(validators, "validators")

    const validatorAddresses = validators.map((obj) => {
      return {
        stash: obj.stash,
        state: obj.state
      };
    });
    // console.log(validatorAddresses, "validatorAddresses");
    // fetch address of validators
    const profile = await models.OffchainProfile.findAll({
      attributes: ['data'],
      include: [{
        model: models.Address,
        attributes: ['address'],
        where: {
          address: {
            [Op.in]: validators.map((obj) => obj.stash)
          }
        },
        required: true,
      }]
    });

    const profileData = profile?.map((element) => {
      element.data = JSON.parse(element.data);
      const { state } = validatorAddresses.find((obj) => obj.stash === element.Address?.address);
      const setProfile = {
        name: element.data.name,
        address: element.Address?.address,
        state
      };
      return setProfile;
    });

    // set names of corresponding addresses in validators
    for (const profile of profileData) {
      for (const address of validatorAddresses) {
        // console.log("profile ", profile)
        if (profile.address === address.stash) {
          await models.Validator.update(
            {
              name: profile.name
            },
            {
              where: {
                stash: address.stash
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
      result: { profileData }
    });
  } catch (e) {
    console.log(e);
    return res.json({
      status: 'Success',
      result: []
    });
  }
};

export default getValidatorNamesAndAddresses;
