import cwModels from '../../commonwealth/server/database';
import ceModels from '../services/database/database';
import {BalanceType} from "common-common/src/types";

async function main() {
  await ceModels.sequelize.transaction(async (t) => {
    console.log("Starting clean-up:")
    const ceDeleted = await ceModels.ChainEvent.destroy({
      where: {
        chain: 'hardhat-local'
      },
      transaction: t
    });
    console.log(`\tDeleted ${ceDeleted} chain-events`);

    const entitiesDeleted = await ceModels.ChainEntity.destroy({
      where: {
        chain:'hardhat-local'
      },
      transaction: t
    });
    console.log(`\tDeleted ${entitiesDeleted} chain-entities`);

    await cwModels.sequelize.transaction(async (t2) => {
      const entityMetaDeleted = await cwModels.ChainEntityMeta.destroy({
        where: {
          chain: 'hardhat-local'
        },
        transaction: t2
      });
      console.log(`\tDeleted ${entityMetaDeleted} chain-entity-meta`);

      const notifDeleted = await cwModels.Notification.destroy({
        where: {
          chain_id: 'hardhat-local'
        },
        transaction: t2
      });
      console.log(`\tDeleted ${notifDeleted} notifications`);

      if (process.argv[2] === 'chains-too') {
        const addressesToDelete = await cwModels.Address.findAll({
          where: {
            chain: 'hardhat-local'
          },
          transaction: t2
        });

        const roleAssignmentsDeleted = await cwModels.RoleAssignment.destroy({
          where: {
            address_id: addressesToDelete.map(x => x.id)
          },
          transaction: t2
        });
        console.log(`\tDeleted ${roleAssignmentsDeleted} role assignments`);

        const communityRolesDeleted = await cwModels.CommunityRole.destroy({
          where: {
            chain_id: 'hardhat-local'
          },
          transaction: t2
        });
        console.log(`\tDeleted ${communityRolesDeleted} community roles`);

        const addressesDeleted = await cwModels.Address.destroy({
          where: {
            chain: 'hardhat-local'
          },
          transaction: t2
        });
        console.log(`\tDeleted ${addressesDeleted} addresses`);

        const subscriptionsDeleted = await cwModels.Subscription.destroy({
          where: {
            chain_id: 'hardhat-local'
          },
          transaction: t2
        });
        console.log(`\tDeleted ${subscriptionsDeleted} subscriptions`);

        const usersDeleted = await cwModels.User.destroy({
          where: {
            selected_chain_id: 'hardhat-local'
          },
          transaction: t2
        });
        console.log(`\tDeleted ${usersDeleted} users`);

        const communityContractDeleted = await cwModels.CommunityContract.destroy({
          where: {
            chain_id: 'hardhat-local'
          },
          transaction: t2
        });
        console.log(`\tDeleted ${communityContractDeleted} community contracts`);

        const chainNodeToDelete = await cwModels.ChainNode.findOne({
          where: {
            url: 'ws://127.0.0.1:8545',
            eth_chain_id: 31337,
            balance_type: BalanceType.Ethereum,
            name: 'Hardhat Local'
          },
          transaction: t2
        });

        if (chainNodeToDelete) {
          const contractsDeleted = await cwModels.Contract.destroy({
            where: {
              chain_node_id: chainNodeToDelete.id
            },
            transaction: t2
          });
          console.log(`\tDeleted ${contractsDeleted} contracts`);

          const chainDeleted = await cwModels.Chain.destroy({
            where: {
              id: 'hardhat-local'
            },
            transaction: t2
          });
          console.log(`\tDeleted ${chainDeleted} chains`);

          const chainNodesDeleted = await cwModels.ChainNode.destroy({
            where: {
              id: chainNodeToDelete.id
            },
            transaction: t2
          })
          console.log(`\tDeleted ${chainNodesDeleted} chain-nodes`);
        }
      }
    })
  });

  console.log("Databases cleared!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
