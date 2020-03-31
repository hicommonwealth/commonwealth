import { Network, Script, ScriptNum } from 'bcoin';
import { WalletClient, NodeClient } from 'bclient';
import ipfsClient from 'ipfs-http-client';
import multihashes from 'multihashes';
import assert from 'assert';

export const setupBcoin = (network, rpcHost, walletHost, apiKey) => {
  const clientOptions = {
    host: rpcHost,
    network: network.type,
    port: network.rpcPort,
    apiKey: apiKey,
  };

  const walletOptions = {
    host: walletHost,
    network: network.type,
    port: network.walletPort,
    apiKey: apiKey,
  };

  const nodeClient = new NodeClient(clientOptions);
  const walletClient = new WalletClient(walletOptions);

  return { nodeClient, walletClient };
};

/**
 * @param {String} locktime - Time that the script can not be redeemed before
 * @param {Buffer} public key hash
 * @returns {Script}
 */
function createScript(locktime, publicKeyHash) {
  let pkh;
  if (typeof publicKeyHash === 'string')
    pkh = Buffer.from(publicKeyHash);
  else pkh = publicKeyHash;
  assert(Buffer.isBuffer(pkh), 'publicKey must be a Buffer');
  assert(
    locktime,
    'Must pass in a locktime argument, either block height or UNIX epoch time'
  );

  const script = new Script();
  // lock the transactions until
  // the locktime has been reached
  script.pushNum(ScriptNum.fromString(locktime.toString(), 10));
  // check the locktime
  script.pushSym('CHECKLOCKTIMEVERIFY');
  // if verifies, drop time from the stack
  script.pushSym('drop');
  // duplicate item on the top of the stack
  // which should be.the public key
  script.pushSym('dup');
  // hash the top item from the stack (the public key)
  script.pushSym('hash160');
  // push the hash to the top of the stack
  script.pushData(pkh);
  // confirm they match
  script.pushSym('equalverify');
  // confirm the signature matches
  script.pushSym('checksig');
  // Compile the script to its binary representation
  // (you must do this if you change something!).
  script.compile();
  return script;
}

/**
 * @param {Script} script to get corresponding address for
 * @param {Network} to determine encoding based on network
 * @returns {Address} - p2wsh segwit address for specified network
 */
export const getAddress = (script, network) => {
  // get the hash of the script
  // and derive address from that
  const p2wsh = script.forWitness();
  const segwitAddress = p2wsh.getAddress().toBech32(network);
  return segwitAddress;
};

export const getNetworkSetting = (network) => {
  switch (network) {
    case 'regtest':
      return Network.get('regtest');
    case 'testnet':
      return Network.get('testnet');
    case 'main':
      return Network.get('main');
    default:
      console.log('No network provided, using regtest');
      return Network.get('regtest');
  }
};

export const getTxDataFromIPFS = async (txsOfInterest, nodeClient, network, multiAddr) => {
  const ipfs = ipfsClient(multiAddr);
  const parsedIpfsData: any[] = await Promise.all(txsOfInterest.map(async (txData) => {
    const ipfsData = await ipfs.get(txData[1]);
    return JSON.parse(ipfsData[0].content);
  }));
  return (await Promise.all(txsOfInterest.map(async (txData, inx) => {
    return (await Promise.all(txData[0].vout.map(async (output) => {
      // Check for P2WSH
      if (output.scriptPubKey.type === 'WITNESSSCRIPTHASH') {
        // Search through IPFS templated tx
        const data = await Promise.all(parsedIpfsData[inx].prevTx.outputs.map(async (out) => {
          const result = await nodeClient.execute('decodescript', [ out.script ]);
          if (result.type === 'WITNESSSCRIPTHASH') {
            // Ensure locking addresses match
            if (result.addresses[0] === output.scriptPubKey.addresses[0] &&
                output.scriptPubKey.addresses[0] === parsedIpfsData[inx].lockingAddr) {
              // Regenerate the script with the stored values
              const regeneratedScript = createScript(
                parsedIpfsData[inx].locktime,
                Buffer.from(parsedIpfsData[inx].publicKeyHash)
              );
              // Get the P2WSH
              const lockingAddr = getAddress(regeneratedScript, network);
              // Check final addresses match
              return (parsedIpfsData[inx].lockingAddr === lockingAddr) ? {
                ...txData[2],
                supernovaAddress: parsedIpfsData[inx].supernovaAddress,
                lockingAddr: parsedIpfsData[inx].lockingAddr,
                redeemScript: parsedIpfsData[inx].redeemScript,
                redeemAddress: parsedIpfsData[inx].redeemAddress,
                prevLink: parsedIpfsData[inx].prevLink,
                lockAmount: output.value,
              } : false;
            }
          }
        }));
        return data.filter((elt) => (!!elt));
      }
    })))
    .filter((elt) => (!!elt))
    .map((elt) => elt[0]);
  })))
  .map((elt) => elt[0]);
};

export const queryAllLocks = async (startBlock, endBlock, nodeClient, network, multiAddr) => {
  console.log(`Querying all locks from block ${startBlock} to ${endBlock}`);
  const txsOfInterest = [];
  for (let i = startBlock; i <= endBlock; i++) {
    const block = await nodeClient.getBlock(i);
    if (block) {
      block.txs.map(async (tx) => {
        const decodedTx = await nodeClient.execute('decoderawtransaction', [ tx.hex ]);
        decodedTx.vout.forEach((output) => {
          if (output.scriptPubKey.type === 'NULLDATA') {
            const data = output.scriptPubKey.asm.split(' ')[1];
            const potentialHash = Buffer.from(data, 'hex').toString();
            try {
              const mh = multihashes.decode(multihashes.fromB58String(potentialHash));
              if (multihashes.isValidCode(mh.code)) {
                txsOfInterest.push([
                  decodedTx,
                  potentialHash,
                  Object.assign({}, tx, { height: i })
                ]);
              }
            } catch (e) {
              // fail gracefully
            }
          }
        });
      });
    }
  }

  return await getTxDataFromIPFS(txsOfInterest, nodeClient, network, multiAddr);
};

export const queryIndividualLock = async (
  queryObj: { address?: string, txHash?: string},
  nodeClient,
  network,
  multiAddr) => {
  const getTemplateTx = async (tx) => {
    const decodedTx = await nodeClient.execute('decoderawtransaction', [ tx.hex ]);
    decodedTx.vout.forEach((output) => {
      if (output.scriptPubKey.type === 'NULLDATA') {
        const data = output.scriptPubKey.asm.split(' ')[1];
        const potentialHash = Buffer.from(data, 'hex').toString();
        try {
          const mh = multihashes.decode(multihashes.fromB58String(potentialHash));
          if (multihashes.isValidCode(mh.code)) {
            return [decodedTx, potentialHash, tx];
          }
        } catch (e) {
          return undefined;
        }
      }
    });
  };

  if (queryObj.address) {
    const result = await nodeClient.getTXByAddress(queryObj.address);
    const txsOfInterest = (await Promise.all(result.map(async (tx) => {
      return await getTemplateTx(tx);
    })))
    .filter((elt) => (!!elt));
    return await getTxDataFromIPFS(txsOfInterest, nodeClient, network, multiAddr);
  }

  if (queryObj.txHash) {
    const result = await nodeClient.getTX(queryObj.txHash);
    const txTemplate = await getTemplateTx(result);

    if (typeof txTemplate !== 'undefined') {
      return await getTxDataFromIPFS([txTemplate], nodeClient, network, multiAddr);
    }
  }
};
