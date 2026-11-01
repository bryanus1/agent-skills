# 🖥️ Conexión y Operación en Servidores Remotos (`ssh-connect`)

> **Gestión, conexión y ejecución remota en servidores SSH con `ssh-connect`. Soporta llaves `.pem` con permisos asegurados (`chmod 600`), contraseñas automatizadas (Keychain) y multiplexación persistente (`ControlMaster`) sin bloqueos de TTY.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `ssh-connect` |
| **Categoría** | `devops` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `ssh-connect`, `ssh`, `bash` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill ssh-connect

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill ssh-connect -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/devops/ssh-connect .agents/skills/ssh-connect

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/ssh-connect .claude/skills/ssh-connect
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Diagnosticar un servidor sin bloquear el TTY**:
  > *"Conéctate al servidor prod-api y dime el uso de disco y memoria"*
  >
  > 🤖 **El agente ejecutará**: `ssh-connect --exec prod-api "df -h && free -m"`  
  > ➔ Consulta sin prompts interactivos, valida permisos de llave `.pem` o credenciales Keychain y reutiliza el socket `ControlMaster` para ejecuciones instantáneas.

* **Descargar logs remotos**:
  > *"Descarga los logs de error de Nginx de prod-api a mi máquina"*
  >
  > 🤖 **El agente ejecutará**: `ssh-connect --download prod-api /var/log/nginx/error.log ./logs/`

* **Registrar un nuevo servidor con llave `.pem`**:
  > *"Registra el servidor prod-api con IP 54.123.45.67, usuario ubuntu y la llave ~/.ssh/aws.pem"*
  >
  > 🤖 **El agente ejecutará**: `ssh-connect --add --alias prod-api --host 54.123.45.67 --user ubuntu --port 22 --type pem --key ~/.ssh/aws.pem`

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, flujo de 6 pasos y reglas críticas de seguridad no interactiva.
- **[CheatSheet de Comandos y Diagnóstico Remoto](references/commands_cheatsheet.md)**: Recetas de diagnóstico para Docker, systemd, bases de datos y red.
