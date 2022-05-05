import { QueryTypes } from 'sequelize';
import { DB } from "../database";

const REACT_POINTS = 1;
const COMMENT_POINTS = 4;
const THREAD_POINTS = 20;
const ADMIN_OR_MOD_POINTS = 30;
const MULTIPLE_COMMUNITIES_POINTS = 10; // 3 or more

type CountResult = Array<{ count: string }>;

export default async function (models: DB): Promise<number> {
  const addresses: Array<{ id: number, address: string, user_id: number | null }> =
    await models.sequelize.query(
      // `SELECT id, address, user_id FROM "Addresses" WHERE ghost_address = FALSE AND created_at > now() - INTERVAL '1 day';`,
      `SELECT id, address, user_id FROM "Addresses" WHERE ghost_address = FALSE;`,
      { type: QueryTypes.SELECT, raw: true }
    );
  const addressIdResults: { [id: number]: number } = {};
  for (const { id } of addresses) {
    addressIdResults[id] = 0;

    // query react points
    const reactsQueryResult: CountResult = await models.sequelize.query(
      `SELECT COUNT(*) FROM "OffchainReactions" WHERE address_id = ${id};`,
      { type: QueryTypes.SELECT, raw: true }
    );
    const reactPoints = REACT_POINTS * (+reactsQueryResult[0]?.count || 0);
    addressIdResults[id] += reactPoints;

    // query comment points
    const commentQueryResult: CountResult = await models.sequelize.query(
      `SELECT COUNT(*) FROM "OffchainComments" WHERE address_id = ${id};`,
      { type: QueryTypes.SELECT, raw: true }
    );
    const commentPoints = COMMENT_POINTS * (+commentQueryResult[0]?.count || 0);
    addressIdResults[id] += commentPoints;

    // query thread points
    const threadQueryResult: CountResult = await models.sequelize.query(
      `SELECT COUNT(*) FROM "OffchainThreads" WHERE address_id = ${id};`,
      { type: QueryTypes.SELECT, raw: true }
    );
    const threadPoints = THREAD_POINTS * (+threadQueryResult[0]?.count || 0);
    addressIdResults[id] += threadPoints;

    // query role points (assigned for each admin role)
    const roleQueryResult: CountResult = await models.sequelize.query(
      `SELECT COUNT(*) FROM "Roles" WHERE address_id = ${id} AND permission != 'member';`,
      { type: QueryTypes.SELECT, raw: true }
    );
    const rolePoints = ADMIN_OR_MOD_POINTS * (+roleQueryResult[0]?.count || 0);
    addressIdResults[id] += rolePoints;
  }

  // combine addresses to produce users
  const userPoints: { [userOrAddress: string]: number } = {};
  const nAddresses: { [address: string]: number } = {};
  for (const { id, user_id, address } of addresses) {
    // track by user_id if available, otherwise track by address
    if (user_id) {
      if (userPoints[user_id] !== undefined) {
        userPoints[user_id] += addressIdResults[id];
      } else {
        userPoints[user_id] = addressIdResults[id];
      }
    } else {
      if (userPoints[address] !== undefined) {
        userPoints[address] += addressIdResults[id];
      } else {
        userPoints[address] = addressIdResults[id];
      }
    }

    // assign points for multiple communities
    if (nAddresses[address] !== undefined) {
      nAddresses[address] += 1;
      if (nAddresses[address] === 3) {
        if (userPoints[user_id]) {
          userPoints[user_id] += MULTIPLE_COMMUNITIES_POINTS;
        } else {
          userPoints[address] += MULTIPLE_COMMUNITIES_POINTS;
        }
      }
    } else {
      nAddresses[address] = 1;
    }
  }

  // compute percentiles by sorting by most to least points
  const userPointsArray = Object.entries(userPoints).sort(([, p1], [, p2]) => p2 - p1);
  const nUsers = userPointsArray.length;
  console.log(`Found ${nUsers} users.`)
  console.log(`\n99th percentile: ${userPointsArray[Math.floor(nUsers * 0.01)][1]}`);
  console.log(`90th percentile: ${userPointsArray[Math.floor(nUsers * 0.1)][1]}`);
  console.log(`75th percentile: ${userPointsArray[Math.floor(nUsers * 0.25)][1]}`);
  console.log(`50th percentile: ${userPointsArray[Math.floor(nUsers * 0.5)][1]}`);
  console.log(`25th percentile: ${userPointsArray[Math.floor(nUsers * 0.75)][1]}`);
  console.log('');
  nUsers >= 100 && console.log(`100th person: ${userPointsArray[100 - 1][1]}`);
  nUsers >= 250 && console.log(`250th person: ${userPointsArray[250 - 1][1]}`);
  nUsers >= 500 && console.log(`500th person: ${userPointsArray[500 - 1][1]}`);
  nUsers >= 1000 && console.log(`1000th person: ${userPointsArray[1000 - 1][1]}`);
  console.log('\nTop ten users:');
  for (let i = 0; i < 10; i++) {
    console.log(`score: ${userPointsArray[i][1]} (id: ${userPointsArray[i][0]})`);
  }
  return 0;
}
