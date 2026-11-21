# 📚 Use Cases and Example Workflows — `gh-cli`

## Case 1: Create a PR linked to an issue

You are on the `feat/42-login-form` branch and the repo has `.gh-domains` with `auth` and `billing`:

```bash
bash <skill-dir>/scripts/create_pr.sh --domain auth --reviewer octocat --dry-run
```

**Preview**:
- **Title**: `feat(#42): ✨ login form`
- **Labels**: `enhancement, domain: auth`
- **Body**:
  ```markdown
  This Pull Request introduces changes for **login form**.

  Closes #42

  **Summary of Changes:**
  - feat: add login form with validation
  - test: cover invalid credentials
  ```

After the user confirms (and if the branch is not published yet):

```bash
bash <skill-dir>/scripts/create_pr.sh --domain auth --reviewer octocat --push
```

If `domain: auth` does not exist on GitHub, the script aborts before creating anything and says which label is missing.

---

## Case 2: PR without an issue

Branch `chore/upgrade-zod`:

```bash
bash <skill-dir>/scripts/create_pr.sh --dry-run
```

**Title**: `chore: 🔧 upgrade zod` (no scope). No type label, because `chore` has no equivalent among GitHub's default labels.

---

## Case 3: Diagnose a PR's failed check

```bash
bash <skill-dir>/scripts/diagnose_run.sh --pr 57 --job lint --lines 40
```

1. Shows `gh pr checks 57`.
2. Finds the latest failed run on the PR's branch.
3. Prints only the failed lines of the `lint` job:
   ```text
   lint  Run pnpm lint  src/auth/login.ts:12:7  error  'user' is assigned a value but never used
   ```
4. The agent fixes `src/auth/login.ts`, runs `pnpm lint` locally and commits. It does not re-run the workflow blindly.

---

## Case 4: Review and merge a PR

```bash
gh pr view 57 --json title,reviewDecision,mergeable --jq '.'
gh pr diff 57
gh pr checks 57
gh pr review 57 --approve --body "LGTM"
gh pr merge 57 --squash --delete-branch    # only after explicit confirmation
```

---

## Case 5: Publish a release

```bash
bash <skill-dir>/scripts/release_helper.sh draft-notes            # local preview
bash <skill-dir>/scripts/release_helper.sh create v1.4.0 --dry-run
bash <skill-dir>/scripts/release_helper.sh create v1.4.0          # after confirmation
```

GitHub generates the notes from the PRs merged since the previous release.
