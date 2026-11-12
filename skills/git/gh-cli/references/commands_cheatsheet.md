# 📘 CheatSheet de Comandos `gh`

Todos los comandos se ejecutan dentro del repositorio. Para otro repo añade `-R owner/repo`. Para leer datos, prefiere `--json <campos> --jq <filtro>`.

---

## Autenticación y Repositorio

```bash
gh auth status                                   # sesión, cuenta y scopes
gh auth login                                    # interactivo: lo ejecuta el usuario
gh repo view --json nameWithOwner,defaultBranchRef --jq '.nameWithOwner, .defaultBranchRef.name'
gh repo clone owner/repo
gh browse                                        # abre el repo en el navegador
```

## Pull Requests

```bash
gh pr list --state open --author @me
gh pr list --search "review-requested:@me"
gh pr status                                     # PRs de la rama actual, creados y pendientes de revisar
gh pr view 57 --comments
gh pr view 57 --json title,state,mergeable,reviewDecision,statusCheckRollup
gh pr diff 57 --name-only
gh pr checkout 57
gh pr create --base main --title "feat(#42): ✨ login form" --body-file body.md --label enhancement
gh pr create --fill --draft                      # título/cuerpo desde los commits
gh pr edit 57 --add-label "domain: auth" --add-reviewer octocat
gh pr ready 57                                   # draft → listo para revisión
gh pr review 57 --approve
gh pr review 57 --request-changes --body "Falta el test de expiración"
gh pr comment 57 --body "Rebasado sobre main"
gh pr checks 57 --watch
gh pr merge 57 --squash --delete-branch
gh pr close 57 --comment "Sustituido por #60"
```

## Issues

```bash
gh issue list --state open --label bug --assignee @me
gh issue view 42 --comments
gh issue create --title "Login falla con SSO" --body-file issue.md --label bug
gh issue comment 42 --body "Reproducido en v1.3.0"
gh issue edit 42 --add-assignee @me --add-label "domain: auth"
gh issue develop 42 --checkout                   # crea y cambia a una rama vinculada al issue
gh issue close 42 --reason completed
```

## GitHub Actions

```bash
gh workflow list
gh run list --branch "$(git branch --show-current)" --limit 5
gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId'
gh run view <run-id>
gh run view <run-id> --log-failed                # solo pasos fallidos
gh run view <run-id> --job <job-id> --log
gh run watch <run-id>
gh run rerun <run-id> --failed
gh workflow run deploy.yml --ref main -f environment=staging
```

## Releases y Tags

```bash
gh release list --limit 10
gh release view v1.4.0
gh release create v1.4.0 --generate-notes --title v1.4.0
gh release create v2.0.0-rc.1 --generate-notes --prerelease --target main
gh release upload v1.4.0 dist/app.tar.gz
```

## Labels

```bash
gh label list --limit 200 --json name --jq '.[].name'
gh label create "domain: auth" --color 0E8A16    # solo con permiso del usuario
```

## API (cuando no hay subcomando)

```bash
gh api repos/{owner}/{repo}/branches/main/protection
gh api graphql -f query='query { viewer { login } }'
gh api --paginate repos/{owner}/{repo}/pulls --jq '.[].number'
```
