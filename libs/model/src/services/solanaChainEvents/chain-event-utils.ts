import * as anchor from '@coral-xyz/anchor';
import { BorshCoder, Event } from '@coral-xyz/anchor';
import { findIdlByProgramId } from '@hicommonwealth/evm-protocols';
import { EventPairs, Events } from '@hicommonwealth/schemas';
import { SolanaEvent, SolanaMapper } from './types';

/**
 * Decodes an event from Anchor-based transaction data.
 * This uses the Anchor IDL to decode the event data.
 * Exported so it can be used by other modules.
 */
export function decodeAnchorEvent(event: SolanaEvent): Event | null {
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

    // Extract the base64-encoded event data
    let eventData: string | null = null;

    // First look for "Program data:" line which contains base64 encoded event data
    const dataLog = event.log.logs.find((log) =>
      log.startsWith('Program data:'),
    );
    if (dataLog) {
      // Extract the base64 data part
      eventData = dataLog.substring('Program data:'.length).trim();
    } else {
      // Try the previous methods if no "Program data:" line exists
      const eventLog = event.log.logs.find(
        (log) =>
          log.includes('Program log: ') &&
          (log.includes(event.meta.event_name || '') ||
            log.includes('Program log: data:')),
      );

      if (eventLog) {
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

    return decodedEvent;
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
  event: Event,
) => {
  return {
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: event.data.contest.toString(),
      contest_id: 0,
      start_time: new Date(Number(event.data.start_time) * 1000),
      end_time: new Date(Number(event.data.end_time) * 1000),
      is_one_off: true,
    },
  };
};

/**
 * Maps a Solana event to a ContestContentAdded event.
 * This mapper handles content added events for contests from Solana programs.
 * Uses Anchor for event decoding.
 */
const contestContentAddedMapper: SolanaMapper<'ContestContentAdded'> = (
  event: Event,
) => {
  return {
    event_name: 'ContestContentAdded',
    event_payload: {
      contest_address: event.data.contest.toString(),
      content_id: Number(event.data.content_id),
      creator_address: event.data.creator.toString(),
      content_url: event.data.url as string,
    },
  };
};

/**
 * Maps a Solana event to a ContestContentUpvoted event.
 * This mapper handles vote events for single contests from Solana programs.
 * Uses Anchor for event decoding.
 */
const singleContestVoteMapper: SolanaMapper<'ContestContentUpvoted'> = (
  event: Event,
) => {
  return {
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: event.data.contest.toString(),
      contest_id: 0,
      content_id: Number(event.data.content_id),
      voter_address: event.data.voter.toString(),
      voting_power: Number(event.data.voting_power).toString(),
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
 * If event type is 'unknown' or 'pending', it will attempt to decode the event first.
 */
export function processSolanaEvents(events: SolanaEvent[]): EventPairs[] {
  return events
    .flatMap((event) => {
      try {
        const decodedEvent = decodeAnchorEvent(event);
        if (decodedEvent) {
          // Find the mapper for this decoded event type
          const mapper = solanaEventMappers[decodedEvent.name];
          if (mapper) {
            return mapper(decodedEvent);
          } else {
            console.warn(
              `No mapper found for decoded event type: ${decodedEvent.name}`,
            );
          }
        }
        return null;
      } catch (error) {
        console.error(`Failed to process Solana event: ${error}`);
        return null;
      }
    })
    .filter((event): event is EventPairs => event !== null);
}
