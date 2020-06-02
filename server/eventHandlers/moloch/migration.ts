/**
 * Processes events during migration, upgrading from simple notifications to entities.
 */
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { factory, formatFilename } from '../../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
   * Handles an event during the migration process, by creating or updating existing
   * events depending whether we've seen them before.
   */
  public async handle(event: CWEvent) {
    return null;
  }
}
