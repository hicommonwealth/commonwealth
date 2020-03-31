import axios from 'axios';
import gql from 'graphql-tag';
import util from 'util';

export default class ChainObjectFetcher {
  private readonly _models;

  private readonly _fetchIntervalMs: number;

  private _intervalHandle;

  constructor(models, fetchIntervalMs) {
    if (fetchIntervalMs < 20) {
      throw new Error('fetch interval must be > 20ms');
    }
    this._models = models;
    this._fetchIntervalMs = fetchIntervalMs;
  }

  public disable() {
    clearTimeout(this._intervalHandle);
  }

  public async enable() {
    if (this._fetchIntervalMs > 0 && !this._intervalHandle) {
      await this.fetch();
      this._intervalHandle = setInterval(() => {
        this.fetch();
      }, this._fetchIntervalMs);
    }
  }

  // the optional fmtString is used to replace any %s-es in the query
  // this is only used for update strings, to query all of a list
  private async _query(q, fmtString?): Promise<{ success: boolean, rows?, error? }> {
    try {
      // perform replacement if required
      let queryString = q.query;
      if (fmtString) {
        queryString = util.format(q.query, fmtString);
      }
      const result = await axios.post(q.query_url, { query: queryString });

      // query and use it to destructure result object, e.g.:
      //         { data: { [field]: [ chainObjects ] } }
      const queryObject = gql`
        ${queryString}
      `;

      // if query looks like `{ proposals { id } }`, this pulls out the "proposals" name
      // FIXME: Needed this compile IDK what kind.valueOf() actually is
      const keyName = queryObject.definitions[0].kind.valueOf();
      const objects: any[] = result.data.data[keyName];
      if (objects.length === 0) {
        console.log('successfully fetched no rows');
        return { success: true, rows: [] };
      }
      const objectRows = objects.map((obj) => ({
        id: `${q.object_type}_${obj[q.ChainObjectVersion.unique_identifier]}`,
        object_type: q.object_type,
        object_id: obj[q.ChainObjectVersion.unique_identifier],
        completed: obj[q.ChainObjectVersion.completion_field],
        object_data: JSON.stringify(obj),
      }));

      // load result into db
      let rows: any[];
      // we can't use updateOnDuplicate with postgres, so we can only bulk create if we know
      // that all created rows will be novel, aka on init. Otherwise, we individually upsert
      // each row.
      if (q.query_type === 'INIT') {
        rows = await this._models.ChainObject.bulkCreate(objectRows);
      } else {
        rows = await this._models.sequelize.transaction(async (t) => {
          const updatedRows = await Promise.all(objectRows.map((obj) => (
            this._models.ChainObject.upsert(obj, { returning: true, transaction: t }))));
          return updatedRows.map(([row]) => row);
        });
      }
      console.log(`fetched rows: ${JSON.stringify(rows.map((r) => r.object_id))}`);
      return { success: true, rows };
    } catch (err) {
      // console.log(err);
      console.log(`failed to fetch rows from provider ${q.query_url}`);
      return { success: false, error: err };
    }
  }

  public async fetch() {
    // grab all active queries
    const queries = await this._models.ChainObjectQuery.findAll({
      where: {
        active: true,
      },
      include: [{
        model: this._models.ChainObjectVersion,
      }],
    });

    // run init queries first (to populate the chain objects)
    const initQueries = queries.filter((q) => q.query_type === 'INIT');
    await Promise.all(initQueries.map((q) => this._query(q)));

    // disable init queries once run (should we check for success?)
    await Promise.all(initQueries.map((q) => {
      q.active = false;
      return q.save();
    }));

    // then run update queries (modify existing chain objects)
    const updateQueries = queries.filter((q) => q.query_type === 'UPDATE');
    await Promise.all(updateQueries.map(async (q) => {
      // first, find existing chain objects which have not yet completed
      const activeObjects = await this._models.ChainObject.findAll({
        where: {
          completed: false,
          object_type: q.object_type,
        },
      });
      if (activeObjects.length === 0) {
        return [];
      }

      // construct the replacement string (an array of ids)
      const replaceStr = JSON.stringify(activeObjects.map((obj) => obj.object_id));
      return this._query(q, replaceStr);
    }));

    // and finally add queries (add new objects we haven't seen before)
    const addQueries = queries.filter((q) => q.query_type === 'ADD');
    await Promise.all(addQueries.map((q) => this._query(q)));
  }
}
