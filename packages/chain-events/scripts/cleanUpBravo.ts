import cwModels from '../../commonwealth/server/database';
import ceModels from '../services/database/database';

async function main() {
  console.log("Starting clean-up:")
  const ceDeleted = await ceModels.ChainEvent.destroy({
    where: {
      chain: 'hardhat-local'
    }
  });
  console.log(`\tDeleted ${ceDeleted} chain-events`);

  const entitiesDeleted = await ceModels.ChainEntity.destroy({
    where: {
      chain:'hardhat-local'
    }
  });
  console.log(`\tDeleted ${entitiesDeleted} chain-entities`);

  const entityMetaDeleted = await cwModels.ChainEntityMeta.destroy({
    where: {
      chain: 'hardhat-local'
    }
  });
  console.log(`\tDeleted ${entityMetaDeleted} chain-entity-meta`);

  const notifDeleted = await cwModels.Notification.destroy({
    where: {
      chain_id: 'hardhat-local'
    }
  });
  console.log(`\tDeleted ${notifDeleted} notifications`);

  console.log("Databases cleared!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
