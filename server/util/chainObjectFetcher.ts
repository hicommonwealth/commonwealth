import request from 'superagent';
import gql from 'graphql-tag';
import util from 'util';

export default class ChainObjectFetcher {
  private readonly _models;
  private readonly _fetchIntervalMs: number;
  private _intervalHandle;
  private _queryUrlOverride;

  constructor(models, fetchIntervalMs, queryUrlOverride) {
    if (fetchIntervalMs < 20) {
      throw new Error('fetch interval must be > 20ms');
    }
    this._models = models;
    this._fetchIntervalMs = fetchIntervalMs;
    this._enabled = false;
    this._queryUrlOverride = queryUrlOverride;
  }

  private _enabled: boolean;
  public get enabled() { return this._enabled; }

  public disable() {
    clearTimeout(this._intervalHandle);
    this._enabled = false;
  }

  public async enable() {
    if (this._fetchIntervalMs > 0 && !this._intervalHandle) {
      await this.fetch();
      this._intervalHandle = setInterval(() => {
        this.fetch();
      }, this._fetchIntervalMs);
      this._enabled = true;
    }
  }

  // the optional fmtString is used to replace any %s-es in the query
  // this is only used for update strings, to query all of a list
  private async _query(
    q,
    hasPagination: boolean,
    fmtString?: string,
    first = 100,
    skip = 0
  ): Promise<{ success: boolean, rows?, error? }> {
    try {
      // first two replacement args are always "first" and "skip", for pagination
      let queryString = q.query;
      if (hasPagination) {
        if (fmtString) {
          queryString = util.format(q.query, first, skip, fmtString);
        } else {
          queryString = util.format(q.query, first, skip);
        }
      } else if (fmtString) {
        queryString = util.format(q.query, fmtString);
      }
      console.log(queryString);
      const result = await request.post(this._queryUrlOverride || q.query_url).send({ query: queryString });
      if (result.body.error) {
        console.log(`FETCH ERROR: ${JSON.stringify(result.body.error)}`);
        return { success: false, error: result.body.error };
      }

      // query and use it to destructure result object, e.g.:
      //         { data: { [field]: [ chainObjects ] } }
      const queryObject = gql`
        ${queryString}
      `;

      // if query looks like `{ proposals { id } }`, this pulls out the "proposals" name
      // FIXME: Needed this compile IDK what kind.valueOf() actually is
      const keyName = queryObject.definitions[0].kind.valueOf();
      const objects: any[] = result.body.data[keyName];
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
      let rows;
      // we can't use updateOnDuplicate with postgres, so we can only bulk create if we know
      // that all created rows will be novel, aka on init. Otherwise, we individually upsert each row.
      if (q.query_type === 'INIT') {
        rows = await this._models.ChainObject.bulkCreate(objectRows);
      } else {
        rows = await this._models.sequelize.transaction(async (t) => {
          const updatedRows = await Promise.all(objectRows.map((obj) => this._models.ChainObject.upsert(obj, { returning: true, transaction: t })));
          return updatedRows.map(([row, updated]) => row);
        });
      }
      // console.log(`fetched rows: ${JSON.stringify(rows.map((r) => ({ id: r.object_id, status: r.status })))}`);
      console.log(`fetched ${rows.length} rows`);

      // recurse to next page if needed
      if (!hasPagination || rows.length < first) {
        return { success: true, rows };
      } else {
        const nextPage = await this._query(q, hasPagination, fmtString, first, skip + first);
        if (nextPage.success) {
          return { success: true, rows: rows.concat(nextPage.rows) };
        } else {
          throw new Error('failed to fetch next page of query');
        }
      }
    } catch (err) {
      // console.log(err);
      console.log(`failed to fetch rows from provider ${this._queryUrlOverride || q.query_url}`);
      console.log(JSON.stringify(err));
      return { success: false, error: err };
    }
  }

  // returns an array of rows
  public async fetch(objectType?, queryType?) {
    // grab all active queries
    const queries = await this._models.ChainObjectQuery.findAll({
      where: {
        active: true,
      },
      include: [{
        model: this._models.ChainObjectVersion,
      }]
    });
    let results: Array<{ success: boolean, rows?, error? }> = [];

    // run init queries first (to populate the chain objects)
    if (!queryType || queryType === 'INIT') {
      const initQueries = queries.filter((q) => q.query_type === 'INIT' && (!objectType || q.object_type === objectType));
      results = results.concat(await Promise.all(initQueries.map((q) => this._query(q, q.has_pagination))));

      // disable init queries once run (should we check for success?)
      await Promise.all(initQueries.map((q) => {
        q.active = false;
        return q.save();
      }));
    }

    if (!queryType || queryType === 'UPDATE') {
      // then run update queries (modify existing chain objects)
      const updateQueries = queries.filter((q) => q.query_type === 'UPDATE' && (!objectType || q.object_type === objectType));
      results = results.concat(await Promise.all(updateQueries.map(async (q) => {
        // first, find existing chain objects which have not yet completed
        const activeObjects = await this._models.ChainObject.findAll({
          where: {
            completed: false,
            object_type: q.object_type,
          }
        });
        if (activeObjects.length === 0) {
          return [];
        }

        // construct the replacement string (an array of ids)
        const replaceStr = JSON.stringify(activeObjects.map((obj) => obj.object_id));
        return await this._query(q, q.has_pagination, replaceStr);
      })));
    }

    if (!queryType || queryType === 'ADD') {
      // and finally add queries (add new objects we haven't seen before)
      const addQueries = queries.filter((q) => q.query_type === 'ADD' && (!objectType || q.object_type === objectType));
      results = results.concat(await Promise.all(addQueries.map((q) => this._query(q, q.has_pagination))));
    }
    return results.filter((r) => r.success).reduce((res, r) => res.concat(r.rows), []);
  }
}
