// import { QueryTypes, Op }  from 'sequelize';
// import { DB } from 'server/database';

// const getContractAbi = async (models: DB, contractAddress: string) => {

//   // get new objects created over the last 14 days
//   const abiQuery = async (address: string) => {
//     return models.sequelize.query(`SELECT abi FROM Contracts WHERE 'address' = ${address};`, {
//       type: QueryTypes.SELECT,
//     });
//   };
//   const abi = await abiQuery(contractAddress);

//   return abi;
// };

// export default getContractAbi;
