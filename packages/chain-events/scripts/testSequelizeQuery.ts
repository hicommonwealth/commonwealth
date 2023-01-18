import models from '../services/database/database';

async function testSequelizeQuery() {
  const eventTypes = (
    await models.ChainEventType.findAll({
      attributes: ['id'],
      where: { chain: 'edgeware' },
    })
  ).map((x) => x.id);

  const dbResult = await models.ChainEvent.max('block_number', {
    where: {
      chain_event_type_id: eventTypes,
    },
  });

  console.log('Database Result:', dbResult);
  process.exit(0);
}

testSequelizeQuery();
