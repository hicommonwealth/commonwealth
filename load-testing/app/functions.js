const faker = require('faker');

module.exports = {
  generateRandomData,
};

function generateRandomData(userContext, events, done) {
  const comment = faker.lorem.sentence(); // generates a random sentence
  const markdownComment = `**${comment}**`; // convert it into Markdown format (bold)
  userContext.vars.comment = markdownComment;
  return done();
}
