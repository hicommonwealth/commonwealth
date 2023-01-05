import { parseAbiItemsFromABI } from 'shared/abi_utils';
import { AppError } from 'common-common/src/errors';
import { AbiItem } from 'web3-utils';
import { Errors } from '../routes/contractAbis/createContractAbi';

/**
 * Parses and validates an ABI string and returns it as an array of Record<string, unknown>
 * and throws an error if it is invalid.
 * @param abiString The ABI string to validate.
 * @throws AppError if the ABI is invalid.
 * @returns Array<Record<string, unknown>>
 */

export default function validateAbi(
  abiString: string
): Array<Record<string, unknown>> {
  // Parse ABI to validate it as a properly formatted ABI
  const abiAsRecord: Array<Record<string, unknown>> = JSON.parse(abiString);
  if (!abiAsRecord) {
    throw new AppError(Errors.InvalidABI);
  }
  const abiItems: AbiItem[] = parseAbiItemsFromABI(abiAsRecord);
  if (!abiItems) {
    throw new AppError(Errors.InvalidABI);
  }
  return abiAsRecord;
}
