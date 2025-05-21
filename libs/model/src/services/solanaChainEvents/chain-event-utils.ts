import * as anchor from '@coral-xyz/anchor';
import { BorshCoder } from '@coral-xyz/anchor';
import { findIdlByProgramId } from '@hicommonwealth/evm-protocols';
import { EventPairs, Events } from '@hicommonwealth/schemas';
import { SolanaEvent, SolanaMapper } from './types';

/**
 * Decodes an event from Anchor-based transaction data.
 * This uses the Anchor IDL to decode the event data.
 */
function decodeAnchorEvent(
  event: SolanaEvent,
): { name: string; data: any } | null {
  try {
    // Find the IDL corresponding to this program ID
    const idlWithAddress = findIdlByProgramId(event.eventSource.programId);
    if (!idlWithAddress) {
      console.warn(
        `No IDL found for program ID: ${event.eventSource.programId}`,
      );
      return null;
    }
    const { idl } = idlWithAddress;
    // Create an Anchor coder from the IDL
    const coder = new BorshCoder(idl);

    // Find the inner instruction that contains our event data
    const eventLog = event.log.logs.find(
      (log) =>
        log.includes('Program log: ') &&
        (log.includes(event.meta.event_name || '') ||
          log.includes('Program log: data:')),
    );

    if (!eventLog) {
      console.warn(
        `No event log found in transaction ${event.transaction.signature}`,
      );
      return null;
    }

    // Extract the base64-encoded event data
    let eventData: string | null = null;

    if (eventLog.includes('Program log: data: ')) {
      // Extract data directly if it's in the expected format
      eventData = eventLog.split('Program log: data: ')[1];
    } else {
      // Try to find the inner instruction that contains our event
      const innerIxIndex = event.log.logs.findIndex((log) =>
        log.includes(`Program log: ${event.meta.event_name || ''}`),
      );
      if (innerIxIndex >= 0 && event.log.data) {
        // If we find a matching event, try to decode using the raw data
        // This follows the structure described in the Anchor approach
        try {
          const parsedData = JSON.parse(event.log.data);
          if (
            parsedData.innerInstructions &&
            parsedData.innerInstructions.length > 0
          ) {
            for (const ix of parsedData.innerInstructions) {
              if (ix.data) {
                const rawData = anchor.utils.bytes.bs58.decode(ix.data);
                eventData = anchor.utils.bytes.base64.encode(
                  rawData.subarray(8),
                );
                break;
              }
            }
          }
        } catch (err) {
          console.warn('Error parsing inner instruction data:', err);
        }
      }
    }

    if (!eventData) {
      console.warn(
        `Could not extract event data from transaction ${event.transaction.signature}`,
      );
      return null;
    }

    // Decode the event using Anchor's event decoder
    const decodedEvent = coder.events.decode(eventData);
    if (!decodedEvent) {
      console.warn(
        `Failed to decode event data from transaction ${event.transaction.signature}`,
      );
      return null;
    }

    return {
      name: decodedEvent.name,
      data: decodedEvent.data,
    };
  } catch (error) {
    console.error('Error decoding Anchor event:', error);
    return null;
  }
}

/**
 * Maps a Solana event to a ContestStarted event.
 * This mapper handles single contest started events from Solana programs.
 * Uses Anchor for event decoding.
 */
const singleContestStartedMapper: SolanaMapper<'ContestStarted'> = (
  event: SolanaEvent,
) => {
  // Decode the event using Anchor
  const decodedEvent = decodeAnchorEvent(event);

  // Directly extract and use data from the decoded event
  const data = decodedEvent!.data;

  return {
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: data.contest.toString(),
      contest_id: 0,
      start_time: new Date(data.start_time * 1000),
      end_time: new Date(data.end_time * 1000),
      is_one_off: data.one_off,
    },
  };
};

/**
 * Maps a Solana event to a ContestContentAdded event.
 * This mapper handles content added events for contests from Solana programs.
 * Uses Anchor for event decoding.
 */
const contestContentAddedMapper: SolanaMapper<'ContestContentAdded'> = (
  event: SolanaEvent,
) => {
  // Decode the event using Anchor
  const decodedEvent = decodeAnchorEvent(event);
  const data = decodedEvent!.data;

  return {
    event_name: 'ContestContentAdded',
    event_payload: {
      contest_address: data.contest.toString(),
      content_id: Number(data.content_id),
      creator_address: data.creator.toString(),
      content_url: data.url,
    },
  };
};

/**
 * Maps a Solana event to a ContestContentUpvoted event.
 * This mapper handles vote events for single contests from Solana programs.
 * Uses Anchor for event decoding.
 */
const singleContestVoteMapper: SolanaMapper<'ContestContentUpvoted'> = (
  event: SolanaEvent,
) => {
  // Decode the event using Anchor
  const decodedEvent = decodeAnchorEvent(event);
  const data = decodedEvent!.data;

  return {
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: data.contest.toString(),
      contest_id: 0,
      content_id: Number(data.content_id),
      voter_address: data.voter.toString(),
      voting_power: data.voting_power.toString(),
    },
  };
};

/**
 * Maps event types to their respective mapper functions for Solana events.
 */
export const solanaEventMappers: Record<string, SolanaMapper<Events>> = {
  NewContest: singleContestStartedMapper,
  ContentAdded: contestContentAddedMapper,
  VoterVoted: singleContestVoteMapper,
};

/**
 * Processes Solana events through the appropriate mappers based on event type.
 */
export function processSolanaEvents(events: SolanaEvent[]): EventPairs[] {
  return events
    .map((event) => {
      const mapper = solanaEventMappers[event.eventSource.eventType];
      if (!mapper) {
        return null;
      }
      try {
        return mapper(event);
      } catch (error) {
        console.error(`Failed to process Solana event: ${error}`);
        return null;
      }
    })
    .filter((event): event is EventPairs => event !== null);
}
