import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const selectAddress = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.address) return next(new Error('Must provide address'));
  if (!req.body.chain) return next(new Error('Must provide chain'));

  // get user's addresses
  const addresses = await req.user.getAddresses();
  const newSelectedAddress = addresses.filter((addr) => {
    return addr.chain === req.body.chain && addr.address === req.body.address && !!addr.verified;
  });
  if (newSelectedAddress.length === 0) {
    return next(new Error('Invalid address'));
  }

  // set other addresses to unselected
  const prevSelectedAddresses = addresses.filter((addr) => {
    return addr.selected && (addr.chain !== req.body.chain || addr.address !== req.body.address);
  });
  for (const prevSelectedAddress of prevSelectedAddresses) {
    prevSelectedAddress.selected = false;
    await prevSelectedAddress.save();
  }

  // set this address to selected
  newSelectedAddress[0].selected = true;
  await newSelectedAddress[0].save();

  return res.json({ status: 'Success', result: { id: newSelectedAddress[0].id } });
};

export default selectAddress;
