// An eslint 'canary' that verifies that eslint-diff properly handles errors
// during the build.  If we don't actually *test* that we fail properly then
// it's possible we added an eslint rule that doesn't actually do anything

// ***** import from outside the project root

import { ServerError } from '../../../../libs/core/src/errors';

function doSomething() {
  throw new ServerError('required or prettier will remove');
}
