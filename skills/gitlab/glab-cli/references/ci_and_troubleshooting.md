# Diagnóstico, CI/CD y Resolución de Problemas con `glab`

Guía para depurar fallos en pipelines de CI/CD, gestionar entornos Self-Managed y resolver errores comunes con GitLab CLI.

---

## 🔍 1. Depuración de Pipelines Fallidos

Cuando un pipeline o job de CI falla:

```bash
# 1. Identificar el estado general del pipeline
glab ci status

# 2. Ver la lista de jobs y encontrar el que falló
glab ci list

# 3. Inspeccionar los logs del job fallido
glab ci trace <nombre-del-job>

# 4. Si el fallo fue transitorio o por red, reintentar el job
glab ci retry
```

---

## 🏢 2. Configuración para GitLab Self-Managed / Dedicated

Si la instancia no es `gitlab.com`, configurar el host predeterminado:

```bash
# Exportar variables de entorno (recomendado para CI o sesiones temporales)
export GITLAB_HOST="https://gitlab.miempresa.com"
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"

# O configurar en glab permanentemente
glab config set host gitlab.miempresa.com
glab auth login --hostname gitlab.miempresa.com
```

---

## ⚠️ 3. Solución de Problemas Frecuentes

| Error / Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| `none of the git remotes configured...` | El remote local no apunta al host configurado | Ejecutar `glab config set remote_alias origin` o verificar `git remote -v`. |
| `401 Unauthorized / Token expired` | Token inválido o sin permisos suficientes | Ejecutar `glab auth login` o regenerar un Personal Access Token con scopes `api`, `write_repository`, `read_user`. |
| `GraphQL/API Forbidden 403` | Permisos insuficientes en el grupo o repositorio | Verificar nivel de rol en el proyecto (Developer/Maintainer). |
| `CI Lint Failed` | Error de sintaxis en `.gitlab-ci.yml` | Ejecutar `glab ci lint .gitlab-ci.yml` para ver la línea exacta del error. |
