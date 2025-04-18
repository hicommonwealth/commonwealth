#!/usr/bin/env node
import {
  CommunityNominationsAbi,
  NamespaceFactoryAbi,
} from '@commonxyz/common-protocol-abis';
import { ethers } from 'ethers';
import { exit } from 'process';

// This script lists event signatures for all specified events

type AbiEntry = {
  abi: any;
  events: Array<string>;
};

const abis: Record<string, AbiEntry> = {
  NamespaceFactoryAbi: {
    abi: NamespaceFactoryAbi,
    events: ['DeployedNamespace'],
  },
  CommunityNominationsAbi: {
    abi: CommunityNominationsAbi,
    events: ['NominatorSettled', 'NominatorNominated', 'JudgeNominated'],
  },
};

function getEventSignature(abi, eventName) {
  const iface = new ethers.utils.Interface(abi);
  const event = iface.getEvent(eventName);
  return {
    signature: iface.getEventTopic(eventName), // Topic hash (Keccak-256)
    humanReadable: `${event.name}(${event.inputs.map((input) => input.type).join(',')})`,
  };
}

async function main() {
  for (const [name, { abi, events }] of Object.entries(abis)) {
    for (const eventName of events) {
      const result = getEventSignature(abi, eventName);
      console.log(
        'Human-Readable Signature:\t',
        `${name}.${result.humanReadable}`,
      );
      console.log('Event Topic (Keccak-256 Hash):\t', result.signature);
      console.log('\n');
    }
  }
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
