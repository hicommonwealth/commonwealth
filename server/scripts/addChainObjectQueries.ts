// TODO: this is just a JSON version of the ChainObject[Version|Query] models
//   maybe we can auto-generate this somehow?
interface IGraphqlQueryObject {
  version: {
    id: string;
    chain: string;
    unique_identifier: string;
    completion_field: string;
    type: string;
  };
  queries: Array<
    {
      object_type: string;
      query_type: string;
      active: boolean;
      description: string;
      query_url: string;
      has_pagination: boolean;
      query: string;
    }
  >;
}

const addChainObjectQueries = async (object: IGraphqlQueryObject, app, models) => {
  // add chain
  await models.Chain.findOrCreate({
    where: {
      id: object.version.chain,
    },
    defaults: {
      network: object.version.chain,
      symbol: object.version.chain,
      name: object.version.chain,
      type: object.version.type,
      active: true,
    }
  });

  // add object version
  await models.ChainObjectVersion.findOrCreate({
    where: {
      id: object.version.id,
    },
    defaults: {
      chain: object.version.chain,
      unique_identifier: object.version.unique_identifier,
      completion_field: object.version.completion_field,
    }
  });

  // add object queries
  await Promise.all(object.queries.map((q) => {
    return models.ChainObjectQuery.findOrCreate({
      where: {
        object_type: q.object_type,
        query_type: q.query_type,
        query_url: q.query_url,
        query: q.query,
      },
      defaults: {
        description: q.description,
        active: q.active,
        has_pagination: q.has_pagination,
      }
    });
  }));
};

export default addChainObjectQueries;
