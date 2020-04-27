'use strict';

module.exports = {
  up: (qI) => qI.sequelize.query(`INSERT INTO "NotificationCategories" (name, description) VALUES ('new-reaction', 'someone reacts to a post');`),
  down: (qI) => qI.sequelize.query(`DELETE FROM "NotificationCategories" WHERE name='new-reaction';`),
};
