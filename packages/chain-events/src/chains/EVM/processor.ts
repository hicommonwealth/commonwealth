import type { CWEvent } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import { pascalToKebabCase } from 'chain-events/src/eth';

export class Processor {
  constructor(
    protected readonly enrich: (
      blockNumber: number,
      kind: string,
      rawData
    ) => Promise<CWEvent>
  ) {}

  public async process(event: any): Promise<CWEvent<any>[]> {
    const log = factory.getLogger(addPrefix(__filename, []));
    const kind = pascalToKebabCase(event.name);
    if (!kind) return [];
    try {
      const cwEvent = await this.enrich(event.blockNumber, kind, event);
      return [cwEvent];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.name}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
