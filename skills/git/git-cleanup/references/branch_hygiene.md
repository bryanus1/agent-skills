# Branch Hygiene and Solving the Squash Merge Problem in Git

## 1. The Squash & Merge Problem

In modern workflows (GitHub, GitLab, Bitbucket), most Pull Requests are merged with **Squash and Merge**.

### Why does `git branch --merged` fail?
The standard `git branch --merged main` command:
1. Compares the direct commit history (SHA-1) of the local branch and `main`.
2. A squash on GitHub collapses the branch's original commits (`c1`, `c2`) into a **single new commit** (`S`) on `main`.
3. For local Git, commits `c1` and `c2` **do not exist on main**, so Git wrongly considers the branch **NOT merged**.
4. As a result, `git branch -d` refuses to delete the branch with this error:
   ```text
   error: The branch 'feat/feature' is not fully merged.
   ```

---

## 2. The Fix: Check Against a Pruned `origin`

When GitHub or GitLab merges and closes a PR, it deletes the remote branch (`origin/feat/feature`).

The right procedure is:
1. `git fetch --prune`: updates the local catalog and removes the `refs/remotes/origin/*` pointers that no longer exist on the server.
2. For each local branch, check whether its `origin/<branch>` counterpart exists:
   - If it exists: the branch is still alive on the remote (PR still in review or work in progress).
   - If it **does not exist**: the branch was deleted on the remote, so it is safe to delete it locally with `git branch -D`.

---

## 3. Protected Branches

Base or long-lived branches must never be deleted, even if they have no explicit remote tracking at the moment:
- `main`
- `master`
- `develop`
- `staging`

### Configuring Exclusions
`git-cleanup` lets you define persistent exclusions in `.git/config`:
```bash
git config --add cleanup.protected develop
git config --global --add cleanup.protected staging
```
