# Adaptadores de Proveedores (Provider Adapters)

Este documento detalla los comandos y herramientas exactos que los agentes deben invocar para leer y escribir issues según el proveedor de gestión de tareas activo.

---

## 🔍 Heurística de Detección de Proveedor

El agente identifica el proveedor analizando el input del usuario:

| Entrada del Usuario | Proveedor Detectado | Herramienta Principal |
|---|---|---|
| `ENG-104`, `ABC-12`, `https://linear.app/...` | **Linear** | Linear MCP (`linear_linear`) / Orca CLI |
| `#42`, `owner/repo#42`, `https://github.com/...` | **GitHub** | `gh` CLI (`gh issue`) |
| `https://gitlab.com/.../issues/12`, o repo GitLab | **GitLab** | `glab` CLI (`glab issue`) |
| Texto pegado, "modo manual", Jira, etc. | **Manual Fallback** | Markdown en chat / archivo |

---

## 1. Adaptador Linear

### Ingesta (Lectura)
- **Vía Linear MCP (`linear_linear`):**
  ```json
  // Llamar herramienta lazy: get_issue
  {
    "id": "ENG-104"
  }
  ```
  *Campos de interés devueltos:* `title`, `description`, `state.name`, `identifier`.

- **Vía Orca CLI (si no hay MCP):**
  ```bash
  orca skills get orca-linear
  ```

### Persistencia (Escritura)
- **Vía Linear MCP:**
  ```json
  // Llamar herramienta lazy: save_issue
  {
    "id": "ENG-104",
    "description": "## 🎯 Objetivo\n..."
  }
  ```

---

## 2. Adaptador GitHub

### Ingesta (Lectura)
- **Comando `gh` CLI:**
  ```bash
  gh issue view <issue-number> --json number,title,body,state,labels
  ```
  *Ejemplo:*
  ```bash
  gh issue view 42 --json number,title,body,state
  ```

### Persistencia (Escritura)
- **Actualizar cuerpo del issue con `gh issue edit`:**
  ```bash
  gh issue edit <issue-number> --body-file <path-to-temp-body.md>
  ```
  *(Recomendado usar `--body-file` para evitar problemas de escape con comillas en la shell)*:
  ```bash
  cat << 'EOF' > /tmp/issue-body.md
  ## 🎯 Objetivo
  ...
  EOF
  gh issue edit 42 --body-file /tmp/issue-body.md
  rm /tmp/issue-body.md
  ```

---

## 3. Adaptador GitLab

### Ingesta (Lectura)
- **Comando `glab` CLI:**
  ```bash
  glab issue view <issue-id> -F json
  ```

### Persistencia (Escritura)
- **Actualizar descripción con `glab issue update`:**
  ```bash
  glab issue update <issue-id> --description "<contenido>"
  ```

---

## 4. Adaptador Manual / Fallback

Si la herramienta remota no tiene CLI ni MCP autenticado (o el usuario usa Jira, Notion, Trello, o texto local):

1. **Lectura:** El usuario proporciona el texto o título directamente en el prompt.
2. **Escritura:** El agente genera el bloque Markdown formateado directamente en la conversación:
   ```markdown
   Aquí tienes la ficha lista para copiar en tu issue:

   ```markdown
   ## 🎯 Objetivo
   ...
   ```
   ```
3. El usuario puede copiar y pegar la ficha con un solo clic.
