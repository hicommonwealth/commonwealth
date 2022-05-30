module.exports = {
  up: async (queryInterface) => {
    const selectQuery =
      'SELECT * FROM "OffchainThreads" WHERE offchain_voting_enabled = TRUE';
    const threadsWithPolls = await queryInterface.sequelize.query(selectQuery);

    const formatTimestamp = (time) => {
      if (time === null) return time;
      const newDate = time ? new Date(time) : new Date();
      const unixTimestamp = (newDate.getTime() / 1000).toFixed(0);
      return `TO_TIMESTAMP(${unixTimestamp})`;
    };

    return threadsWithPolls[0].map(async (thread) => {
      try {
        if (!thread.offchain_voting_options?.length) return;
        const voting_options = JSON.parse(thread.offchain_voting_options);
        const prompt = voting_options.name;
        const options = JSON.stringify(voting_options.choices);

        const ends_at = formatTimestamp(thread.offchain_voting_ends_at);
        const now = formatTimestamp();

        const columns =
          '(thread_id, chain_id, prompt, options, ends_at, created_at, updated_at)';
        const values = `(?, ?, ?, ?, ${ends_at}, ${now}, NULL)`;
        const updateQuery = `INSERT INTO "OffchainPolls" ${columns} VALUES ${values};`;
        await queryInterface.sequelize.query(updateQuery, {
          replacements: [
            thread.id,
            thread.chain,
            prompt,
            options,
            ends_at,
            now,
          ],
        });
      } catch (e) {
        console.log(`Failed to transfer poll data from thread ${thread?.id}`);
      }
    });
  },

  down: async (queryInterface) => {
    // Do we want a proper "down" migration?
    // Writing manual SQL queries takes a lot of eng time
    return queryInterface.sequelize.query(`DELETE FROM "OffchainPolls"`);
  },
};
