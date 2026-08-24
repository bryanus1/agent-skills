# GitLab CLI (`glab`) Commands CheatSheet

Guía rápida de referencia para los comandos más utilizados de `glab`.

---

## 🔐 1. Autenticación y Configuración

```bash
# Iniciar sesión interactiva (GitLab.com o Self-Managed)
glab auth login

# Iniciar sesión con token no interactivo
glab auth login --hostname gitlab.example.com --token "$GITLAB_TOKEN"

# Verificar estado de autenticación
glab auth status

# Configurar valores globales
glab config set editor vim
glab config set host gitlab.example.com
```

---

## 🔀 2. Merge Requests (`glab mr`)

```bash
# Listar Merge Requests abiertos
glab mr list

# Ver detalles de un MR específico
glab mr view <id-o-branch>
glab mr view <id> --web

# Crear un Merge Request
glab mr create --title "feat: new feature" --description "Detalles del cambio" --target-branch main --remove-source-branch

# Crear MR rápido a partir del último commit
glab mr create --fill --yes

# Hacer checkout de la rama de un MR
glab mr checkout <id>

# Ver diff de un MR
glab mr diff <id>

# Aprobar un MR
glab mr approve <id>

# Fusionar / Merge de un MR
glab mr merge <id> --squash --remove-source-branch
```

---

## 🔄 3. CI/CD Pipelines & Jobs (`glab ci` / `glab job`)

```bash
# Ver estado del pipeline actual
glab ci status

# Listar pipelines recientes
glab ci list

# Ver pipeline en vivo / interactivo
glab ci view

# Ejecutar / disparar un nuevo pipeline
glab ci run -b <branch>

# Ver traza/logs en tiempo real del último job o job específico
glab ci trace [job-name]

# Reintentar un job o pipeline fallido
glab ci retry

# Validar sintaxis de .gitlab-ci.yml
glab ci lint .gitlab-ci.yml
```

---

## 📋 4. Issues & Work Items (`glab issue`)

```bash
# Listar issues asignados o abiertos
glab issue list --assignee @me
glab issue list --label "bug"

# Ver un issue
glab issue view <id>

# Crear un nuevo issue
glab issue create --title "Error en autenticación" --description "Pasos para reproducir..." --label "bug,priority:high"

# Comentar en un issue
glab issue note <id> --message "Investigando la causa raíz..."

# Cerrar o reabrir issue
glab issue close <id>
glab issue reopen <id>
```

---

## 📦 5. Releases y Changelogs (`glab release` / `glab changelog`)

```bash
# Listar releases
glab release list

# Crear un release con tag y binarios adjuntos
glab release create v1.0.0 --name "v1.0.0 Release" --notes "Notas de versión..." dist/*.tar.gz

# Generar changelog automático
glab changelog generate --version v1.0.0
```

---

## ⚙️ 6. Variables CI/CD y API Directa (`glab variable` / `glab api`)

```bash
# Listar variables del proyecto
glab variable list

# Crear o actualizar una variable CI/CD
glab variable set DATABASE_URL "postgres://user:pass@host:5432/db" --protected --masked

# Consultar la API REST de GitLab directamente
glab api projects/:id/repository/branches
glab api /users
```
