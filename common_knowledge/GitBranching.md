
# Git Branching

We use a model something close to [Trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) 
where we try to merge code to master often and send in small pull requests.

We use the standard/default merge strategy for Git which helps avoid merge
conflicts so you can merge master and smaller (possibly stacked) PRs into your
development branch often.

# Key Suggestions

## Commit early, commit often

Make sure to commit your code early and often. This allows for smaller and
discrete integration tests but also reduces the chance that your code will cause
a merge conflict later.

## Send Smaller PRs

Generally a PR should do one thing only.  Try to break up your larger PRs so that
it's easy to review and merge into master quickly.

If other developers are sending in larger PRs please recommend that they break
them into smaller PRs. 

If you MUST send a large PR please explain why it is required.

For example, maybe your PR is an automated code change. In this situation you
would commit this as one PR and then document why it is required and the command
you ran.  

## Avoid Rebase.

Don't rebase your branches as this will increase the risk of merge conflicts.

There’s really no major advantage to rebase other than a cleaner git history.
However, the downsides are higher risk of merge conflicts and conflicts when you
share rebased commits

# Cherry Picking Specific Branches

Let's say you want to merge a specific branch:

https://github.com/hicommonwealth/commonwealth/pull/9689/commits

You can see all the merge commits on master with this command:

```bash
git log --merges --oneline master
```

Now we should have the PR merge that we want (9689) and to compute a patch all
we have to do is diff between the commit on the next line.

```text
5a1d547b77 Merge pull request #9689 from hicommonwealth/9681.israel.incorrect-redirect-from-profile
afeefe9fa7 Merge pull request #9704 from hicommonwealth/kaleemNeslit.9651.tooltip_reverse_state
```

```bash
git diff -r afeefe9fa7 -r 5a1d547b77 > cherrypick.patch
```

This will be the cherrypicked patch file, and you can patch that onto a specific
branch with the patch command.
