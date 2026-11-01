# Guía de Higiene de Ramas y Resolución del Squash Merge en Git

## 1. El Problema del Squash & Merge en Git

En flujos de trabajo modernos (GitHub, GitLab, Bitbucket), la mayoría de los Pull Requests se integran usando **Squash and Merge**.

### ¿Por qué falla `git branch --merged`?
El comando estándar `git branch --merged main`:
1. Compara el historial de commits directos (SHA-1) entre la rama local y `main`.
2. Al hacer Squash en GitHub, los commits originales de la rama (`c1`, `c2`) se colapsan en un **único commit nuevo** (`S`) en `main`.
3. Para Git local, los commits `c1` y `c2` **no existen en main**, por lo que Git considera erróneamente que la rama **NO está fusionada**.
4. Como consecuencia, `git branch -d` rechaza eliminar la rama con el error:
   ```text
   error: The branch 'feat/feature' is not fully merged.
   ```

---

## 2. La Solución: Verificación contra `origin` Podado

Cuando GitHub o GitLab fusionan y cierran un PR, borran la rama remota (`origin/feat/feature`).

El procedimiento correcto consiste en:
1. `git fetch --prune`: actualiza el catálogo local eliminando los punteros `refs/remotes/origin/*` que ya no existen en el servidor.
2. Comprobar para cada rama local si existe su contraparte `origin/<rama>`:
   - Si existe: la rama sigue viva en el remoto (PR aún en revisión o trabajo en curso).
   - Si **no existe**: la rama ya fue borrada en el remoto, por lo que puede eliminarse localmente con seguridad usando `git branch -D`.

---

## 3. Ramas Protegidas

Las ramas base o de larga duración nunca deben borrarse, incluso si no tienen seguimiento remoto explícito en ese momento:
- `main`
- `master`
- `develop`
- `staging`

### Configuración de Exclusiones
`git-cleanup` permite definir exclusiones persistentes en el archivo `.git/config`:
```bash
git config --add cleanup.protected develop
git config --global --add cleanup.protected staging
```
