# React.StrictMode

When a React application is wrapped in React.StrictMode, React performs extra checks and validations during development mode. These checks include:

- Identifying components with unsafe lifecycle methods and providing warnings about them.
- Detecting legacy string ref usage and warning about it.
- Detecting deprecated findDOMNode usages and warning about it.
- Detecting unexpected side effects within the render phase and warning about it.
- Detecting a few other potential issues.

## Change Log 

- 231013: Flagged by Graham Johnson for consolidation with `React-Best-Practices-And-Improvements.md`
- 230221: Authored by Forest Mars.