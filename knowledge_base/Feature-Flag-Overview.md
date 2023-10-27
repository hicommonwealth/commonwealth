## Overview

“Feature Flag” refers to a set of flags that can be enabled/disabled at runtime. These are used to show or hide beta features.


### (Product) Feature Flag Management Side
Currently, we use a service to handle feature flag querying as well as management called “Unleash“. With this service
feature flags are added via the management tool. A groupId specifies a name that we can call the feature flag by on the
engineering side. A rollout percentage can be specified which determines the percentage of end users that will see
this feature flagged feature.

### (Engineering) Using Feature flags
Feature flags can be used either on the front or the backend. In both situations we pass a groupId into the function.
These groupIds correspond to the group id set on the unleash instance for the feature flag.

#### Front End
We add feature flags with a React hook.
This hook evaluates to either a true or false, with which we can conditionally render the feature flagged feature.
The following is an example which will show a new landing page based on the outcome returned from the Unleash server:

```js
const TestComponent = () => {
  const enabled = useFlag('new.landing');

  if (enabled) {
    return <SomeComponent />;
  }
  return <AnotherComponent />;
};

export default TestComponent;
```

Keep in mind when implementing these, that React re-renders all child components when a parent's state updates. As a result
if the feature flag is high up on the component ancestor tree, then all child components will update in the event where the
feature flag evaluates to true.

#### Back End
On the backend things are much simpler. Since there is no diffing or re-rendering, there is no tradeoffs you need to make.
There should be 2 cases here:
1. kill switch flag (100% or 0%)
2. feature flag for performance testing

As an example of 1, inside a route method:
```js
export const getComments = async (...) => {
  ...
  if (unleash.isEnabled('comments')){
      return models.Comments.findAll(newQuery);
  }

    return models.Comments.findAll(oldQuery);
});
```

As an example of 2, if we were to make a new route method:
```js
export const getExperimentalRoute = async (...) => {
    if (!unleash.isEnabled('experimental.kill.switch')){
        return failure(res.status(404), null)
    }

    return ...;
});
```