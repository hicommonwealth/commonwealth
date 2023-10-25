import { factory, formatFilename } from 'common-common/src/logging';
import Rollbar from 'rollbar';
import { bech32ToHex } from '../../shared/utils';
import type { DB } from '../models';

/**
 This is meant to run once in each environment.
 Since it updates so many rows, we want to do this instead of a major migration.
 Once it has run successfully, this entire file can be removed.
 New addresses will have their hex generated upon creation.
 */
export class HexCreator {
  private readonly log = factory.getLogger(formatFilename(__filename));
  private _models: DB;
  private _rollbar?: Rollbar;
  private _debug? = false; // for integration tests
  private _completed = false;

  public init(models: DB, rollbar?: Rollbar, debug?: boolean) {
    this._models = models;
    this._rollbar = rollbar;
    this._debug = debug;
  }

  /**
   * @param models An instance of the DB containing the sequelize instance and all the models.
   * @param rollbar A rollbar instance to report errors
   */
  public initJob(models: DB, rollbar?: Rollbar, debug?: boolean) {
    this.init(models, rollbar, debug);

    const now = new Date();
    this.runJob();

    this.log.info(`The current date is ${now.toString()}. Running job...`);
  }

  public async runJob() {
    await this.executeQueries();
  }

  public async executeQueries() {
    if (!this._models) {
      this.log.error(`Must initialize the job before executing queries`);
      return;
    }
    this.log.info('Hex creation starting...');

    try {
      await this.createHexes();
      this.log.info('Hex creation finished.');
      this._completed = true;
    } catch (e) {
      this.log.info('Cosmos hex job interrupted: ', e);
      this._rollbar?.info('Cosmos hex job interrupted:', e);
    }
  }

  /**

   */
  public async createHexes() {
    await this._models.sequelize.transaction(async (t) => {
      // get all cosmos addresses and assign a hex
      const bulkUpdateData = [];
      const [addresses] = await this._models.sequelize.query(
        `
        SELECT *
        FROM "Addresses"
        WHERE "wallet_id" IN ('keplr', 'cosm-metamask', 'terrastation', 'keplr-ethereum');     
          `,
        { transaction: t }
      );

      if (!this._debug && addresses.some((address: any) => !!address.hex)) {
        throw new Error('Some hexes already in DB. Skipping job...');
      } else {
        for (const address of addresses as any[]) {
          const hex = await bech32ToHex(address.address);

          if (hex) {
            const hexAddress = {
              ...address,
              hex,
            };
            bulkUpdateData.push(hexAddress);
          }
        }

        if (bulkUpdateData.length > 0) {
          // update all addresses with their hex value
          await this._models.Address.bulkCreate(bulkUpdateData, {
            updateOnDuplicate: ['hex'],
          });
          console.log(
            `${bulkUpdateData.length} Cosmos addresses updated with hex strings.`
          );
        } else {
          console.log('No Cosmos hexes added.');
        }
      }
    });
  }

  public get completed() {
    return this._completed;
  }
}

export const hexCreator = new HexCreator();
