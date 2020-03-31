const addTestChainObjectQueries = async (app, models, closeMiddleware) => {
  const testQueries = (await import('../test/chainObjectQueries')).default;

  // add test chain
  await models.Chain.findOrCreate({
    where: {
      id: testQueries.version.chain,
      network: testQueries.version.chain,
      symbol: testQueries.version.chain,
      name: testQueries.version.chain,
      active: true,
    }
  });

  // add test object version
  await models.ChainObjectVersion.findOrCreate({
    where: {
      id: testQueries.version.id,
      chain: testQueries.version.chain,
      unique_identifier: testQueries.version.unique_identifier,
      completion_field: testQueries.version.completion_field,
    },
  });

  // add test queries
  await Promise.all(testQueries.queries.map((q) => {
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
      }
    });
  }));

  await models.sequelize.close();
  closeMiddleware().then(() => {
    console.log('Finished adding test queries to db.');
    process.exit(0);
  });
};

export default addTestChainObjectQueries;
