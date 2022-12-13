import BN from 'bn.js';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  CommonwealthTypes,
} from 'chain-events/src';
import { addPrefix, factory } from 'common-common/src/logging';
import { DB } from '../models';

export default class extends IEventHandler {
  public readonly name = 'Project';

  constructor(private readonly _models: DB) {
    super();
  }

  /**
   * Handles a project-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    // XXX TODO: REWORK THIS
    if (event.data.kind === CommonwealthTypes.EventKind.ProjectCreated) {
      // handle creation event by checking against projects table
      const entityId = dbEvent?.entity_id;
      if (!entityId) {
        log.error(`Entity not found on dbEvent: ${dbEvent.toString()}`);
        return; // oops, should not happen
      }
      const index = event.data.index;

      const projectRow = await this._models.Project.findOne({
        where: { id: +index },
      });
      if (projectRow) {
        log.error(`Project ${index} already exists in db.`);
        return;
      }

      // create new project (this should be the only place Projects are created)
      await this._models.Project.create({
        id: +index,
        entity_id: entityId,
      });
    }

    return dbEvent;
  }
}
