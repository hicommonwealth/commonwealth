
# Git Branching

We use a model something close to [Trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) 
where we try to merge code to master often and send in small pull requests.

We use the standard/default merge strategy for Git which avoids helps avoid
merge conflicts so you can merge master and smaller (possibly stacked) PRs into
your development branch often.

# Key Suggestions

## Commit early, commit often

Make sure to commit your code early and often. This allows for smaller and
discrete integration tests but also reduces the chance that your code will cause
a merge conflict later.

## Conventional Commits

Use [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) in your PR title.

## Send Smaller PRs

Generally a PR should do one thing only.  Try to break up your larger PRs so that
it's easy to review and merge into master quickly.

If other developers are sending in larger PRs please recommend that they break
them into smaller PRs. 

## Avoid Rebase.

Don't rebase your branches as this will increase the risk of merge conflicts.

There’s really no major advantage to rebase other than a cleaner git history.
However, the downsides are higher risk of merge conflicts and conflicts when you
share rebased commits

## Write Unit Tests

If you send in a small PR try to write unit tests that cover that new code.

This way the person merging the branch doesn't need to checkout your branch and 
review it.

