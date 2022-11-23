import {QueryTypes} from "sequelize";
import models from '../database';

async function main() {
  console.log("Starting Query")
  const result = await models.sequelize.query(`
          SELECT * FROM "ChainEvents" LIMIT 10;
  `, {type: QueryTypes.SELECT, raw: true});

  console.log(result);
  console.log("Execution Finished")
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
