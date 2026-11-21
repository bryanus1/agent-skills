# 🛠️ GitHub Actions and Troubleshooting

---

## 1. Diagnosing a Failed Run

1. Find the run: `bash <skill-dir>/scripts/diagnose_run.sh` (latest failure on the branch) or `--pr <n>` to see a PR's checks.
2. Read only what failed: the script uses `gh run view <id> --log-failed`, whose format is `<job>\t<step>\t<line>`. `--job <name>` filters on the first column.
3. Find the cause in the log (the first error, not the last) and fix the code.
4. Verify locally with the same command the workflow runs before pushing again.
5. Re-run only if the failure is transient: `gh run rerun <id> --failed`.

---

## 2. Common Errors

| Symptom in the log | Likely cause | Action |
| :--- | :--- | :--- |
| `ERR_PNPM_OUTDATED_LOCKFILE` / `npm ci` fails on the lockfile | Lockfile out of sync with `package.json` | Reinstall locally and commit the lockfile |
| `Resource not accessible by integration` | `GITHUB_TOKEN` lacks permissions | Add `permissions:` to the job (e.g. `contents: write`, `pull-requests: write`) |
| `Error: Input required and not supplied: token` | Missing secret, or not available to PRs from forks | Check `gh secret list`; forks do not receive secrets |
| Job queued forever | Self-hosted runner down or a `runs-on` label that does not exist | Check `runs-on` and the runners' status |
| `The process '/usr/bin/git' failed with exit code 128` | `fetch-depth` too shallow or checkout credentials | `actions/checkout` with `fetch-depth: 0` if the step needs history |
| Tests pass locally and fail in CI | Different Node/OS versions, time zone or ordering | Pin versions in `setup-*` and reproduce with the same variables |
| `Process completed with exit code 137` | Out of memory (OOM) | Reduce parallelism or use a runner with more memory |

---

## 3. Required Checks and Branch Protection

```bash
gh pr checks 57                                          # status of each check
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.required_status_checks.contexts'                # required checks
```

- A PR cannot be merged while a required check is missing, even if all the others are green.
- `gh pr merge --auto --squash` schedules the PR to merge once they pass.
- Never use `gh pr merge --admin` to bypass the protection.

---

## 4. Running and Watching Workflows

```bash
gh workflow list
gh workflow run ci.yml --ref feat/42-login-form          # needs a workflow_dispatch trigger
gh run watch <run-id> --exit-status                      # exits with an error if the run fails
```

---

## 5. `gh` Authentication

| Problem | Fix |
| :--- | :--- |
| `gh: To get started with GitHub CLI, please run: gh auth login` | The user runs `gh auth login` |
| `HTTP 404` on a private repo | The account has no access or lacks the `repo` scope |
| `HTTP 403` when merging or labeling | Not enough repo permissions (*write* or *maintain* needed) |
| Workflows cannot be edited through the API | The token needs the `workflow` scope: `gh auth refresh -s workflow` |
