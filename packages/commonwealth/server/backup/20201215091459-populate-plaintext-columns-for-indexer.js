'use strict';

// copied from shared/utils because sequelize migration import pipeline seems broken
const preprocessQuillDeltaForRendering = (nodes) => {
  // split up nodes at line boundaries
  const lines = [];
  for (const node of nodes) {
    if (typeof node.insert === 'string') {
      node.insert.match(/[^\n]+\n?|\n/g).forEach((line) => {
        lines.push({ attributes: node.attributes, insert: line });
      });
    } else {
      lines.push(node);
    }
  }
  // group nodes under parents
  const result = [];
  let parent = { children: [], attributes: undefined };
  for (const node of lines) {
    if (typeof node.insert === 'string' && node.insert.endsWith('\n')) {
      parent.attributes = node.attributes;
      // concatenate code-block node parents together, keeping newlines
      if (
        result.length > 0 &&
        result[result.length - 1].attributes &&
        parent.attributes &&
        parent.attributes['code-block'] &&
        result[result.length - 1].attributes['code-block']
      ) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[
          result.length - 1
        ].children.concat(parent.children);
      } else {
        parent.children.push({ insert: node.insert });
        result.push(parent);
      }
      parent = { children: [], attributes: undefined };
    } else {
      parent.children.push(node);
    }
  }
  // If there was no \n at the end of the document, we need to push whatever remains in `parent`
  // onto the result. This may happen if we are rendering a truncated Quill document
  if (parent.children.length > 0) {
    result.push(parent);
  }

  // trim empty newlines at end of document
  while (
    result.length &&
    result[result.length - 1].children.length === 1 &&
    typeof result[result.length - 1].children[0].insert === 'string' &&
    result[result.length - 1].children[0].insert === '\n' &&
    result[result.length - 1].children[0].attributes === undefined
  ) {
    result.pop();
  }

  return result;
};

const renderQuillDeltaToText = (delta, paragraphSeparator = '\n\n') => {
  return preprocessQuillDeltaForRendering(delta.ops)
    .map((parent) => {
      return parent.children
        .map((child) => {
          if (typeof child.insert === 'string')
            return child.insert.trimRight('\n');
          if (child.insert && child.insert.image) return '(image)';
          if (child.insert && child.insert.twitter) return '(tweet)';
          if (child.insert && child.insert.video) return '(video)';
          return '';
        })
        .filter((child) => !!child)
        .join(' ')
        .replace(/  +/g, ' '); // remove multiple spaces
    })
    .filter((parent) => !!parent)
    .join(paragraphSeparator);
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      console.log('Populating OffchainThreads plaintext');
      const threads = await queryInterface.sequelize.query(
        'SELECT id, body FROM "OffchainThreads";',
        {
          transaction: t,
        }
      );
      console.log(threads[0].length);
      await Promise.all(
        threads[0].map(async (thread) => {
          const id = thread.id;
          const plaintext = (() => {
            try {
              return renderQuillDeltaToText(
                JSON.parse(decodeURIComponent(thread.body))
              );
            } catch (e) {
              return decodeURIComponent(thread.body);
            }
          })();
          console.log('Migrating OffchainThread id:', id);
          await queryInterface.sequelize.query(
            'UPDATE "OffchainThreads" SET plaintext=:plaintext WHERE id=:id;',
            {
              replacements: { id, plaintext },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
            },
            { transaction: t }
          );
        })
      );

      console.log('Populating OffchainComments plaintext');
      const comments = await queryInterface.sequelize.query(
        'SELECT id, text FROM "OffchainComments";',
        {
          transaction: t,
        }
      );
      console.log(comments[0].length);
      await Promise.all(
        comments[0].map(async (comment) => {
          const id = comment.id;
          const plaintext = (() => {
            try {
              return renderQuillDeltaToText(
                JSON.parse(decodeURIComponent(comment.text))
              );
            } catch (e) {
              return decodeURIComponent(comment.text);
            }
          })();
          console.log('Migrating OffchainComment id:', id);
          await queryInterface.sequelize.query(
            'UPDATE "OffchainComments" SET plaintext=:plaintext WHERE id=:id;',
            {
              replacements: { id, plaintext },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
            },
            { transaction: t }
          );
        })
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve) => resolve());
  },
};
