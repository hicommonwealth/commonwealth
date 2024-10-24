import { SchemaType } from '../../Schema';
import { createIdentitySchemaCreator } from '../../utils/createIdentitySchemaCreator';
import { getErrorMessageForIncorrectType } from '../../utils/getErrorMessageForIncorrectType';
export function stringLiteral(literal) {
  const schemaCreator = createIdentitySchemaCreator(
    SchemaType.STRING_LITERAL,
    (value, { breadcrumbsPrefix = [] } = {}) => {
      if (value === literal) {
        return {
          ok: true,
          value: literal,
        };
      } else {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(value, `"${literal}"`),
            },
          ],
        };
      }
    },
  );
  return schemaCreator();
}
