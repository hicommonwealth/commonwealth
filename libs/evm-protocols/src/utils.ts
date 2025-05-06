import {
  createPublicClient,
  http,
  ParseAbiItem,
  parseAbiItem,
  parseEventLogs,
} from 'viem';

/**
 * Verifies that an event is valid. Used primarily to verify the authenticity of
 * chain event sources created by users.
 * @param rpc The RPC URL to use to verify the event.
 * @param contractAddress The contract address from which the event is emitted.
 * @param readableEventSignature e.g 'event Transfer(address indexed, address, uint256)'
 * @param txHash A transaction hash in which the event was emitted. Used to verify authenticity.
 */
export async function verifyEventSource({
  rpc,
  contractAddress,
  readableEventSignature,
  txHash,
}: {
  rpc: string;
  contractAddress: string;
  readableEventSignature: string;
  txHash: string;
}): Promise<{ valid: boolean; reason: string }> {
  let eventAbi: ParseAbiItem<string>;
  try {
    eventAbi = parseAbiItem(readableEventSignature);
  } catch (e) {
    return {
      valid: false,
      reason: 'Invalid event signature',
    };
  }

  const client = createPublicClient({
    transport: http(rpc),
  });

  // Verify the contract exists
  const code = await client.getCode({
    address: contractAddress as `0x${string}`,
  });
  if (!code || code === '0x' || code === '0x0') {
    return {
      valid: false,
      reason: "Contract doesn't exist at provided address",
    };
  }

  const receipt = await client.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });
  const logs = parseEventLogs({
    logs: receipt.logs,
    abi: [eventAbi],
    strict: true,
  });

  if (logs.length === 0) {
    return {
      valid: false,
      reason: 'No matching event found',
    };
  }

  return {
    valid: true,
    reason: 'Log found',
  };
}
