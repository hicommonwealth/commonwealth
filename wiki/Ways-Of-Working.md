## Tickets, Pull Requests, & the Project Board

All work must be associated with a ticket (GitHub issue), and this ticket must have its status set to "in progress." The ticket _must_ come before the pull request, as we now use automated software which relies on this precedence.

If an engineer opens a new ticket, it can be either in-scope of a current project, or out-of-scope. 

Engineers are welcome to open several pull requests to close an outstanding ticket. Such PRs can be either _dependent_ or _sequential_ (i.e., independent), and should be flagged accordingly, so that blocking PRs are prioritized for merging. See the [Agile Development "Story Point Estimation" section](./Agile-Development.md#story-point-estimation) for further context.

All new tickets should be set to "no status" for the current cycle. Work should not begin until an engineer has been assigned to the ticket, and it has been assigned an "in progress" status.

Close your own PR: if it's ready for QA, tag a reviewer, complain in a Slack channel, or send a DM. 

Never change the title or description of someone else's Github story without permission. 

## Github Quality Checks

Pull requests to master _should_ pass Github's code quality checks. (Nb: Not the test suite run by our CI, but those quality checks identified in the PR's files/diff.) PR authors _should_ resolve these checks themselves.

Any pull requests originating in the experimental branch, and being merged into master, _must_ pass all code quality checks. PR authors _must_ resolve these checks themselves.

Occasionally, quality checks will erroneously flag code which is used throughout our codebase, such as `useEffect`. These should be ignored.