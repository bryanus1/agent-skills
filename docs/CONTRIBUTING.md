# 🤝 Guía de Contribución: Agent Skills Hub

¡Gracias por tu interés en contribuir a **Agent Skills Hub**! Esta guía te ayudará a crear, probar y enviar nuevas skills que funcionen perfectamente en cualquier asistente o agente de IA.

---

## 🛠️ Requisitos Previos

- **Node.js**: v18 o superior.
- **pnpm**: v9 o v10 (`npm install -g pnpm` o `corepack enable`).
- **Git**: Configurado en tu entorno local.

---

## 🚀 Proceso de Creación de una Nueva Skill

### 1. Clonar el repositorio y crear una rama

```bash
git checkout -b skill/mi-nueva-skill
```

### 2. Usar una plantilla base

Elige una de las plantillas disponibles en `templates/`:

- `templates/basic-skill`: Para flujos procedimentales y guías basadas en instrucciones markdown.
- `templates/tool-assisted-skill`: Para flujos avanzados que requieren scripts auxiliares (`scripts/`), documentación de referencia (`references/`) o ejemplos (`examples/`).

Copia la plantilla dentro del directorio correspondiente en `skills/<categoría>/<nombre-de-skill>`:

```bash
mkdir -p skills/devops/mi-nueva-skill
cp -r templates/basic-skill/* skills/devops/mi-nueva-skill/
```

### 3. Redactar el `SKILL.md`

Sigue las directrices de [`SPECIFICATION.md`](file:///Users/brayansanjuan/Development/personal/agent-skills/docs/SPECIFICATION.md):
- **Nombre (`name`)**: En kebab-case (ej. `docker-multistage-build`).
- **Descripción (`description`)**: Breve, concisa (máximo 350 caracteres) y con palabras clave de activación claras.
- **Triggers**: Al menos 2 términos clave que representen la intención del usuario.

### 4. Validar tu Skill localmente

Ejecuta el linter de skills para comprobar que la estructura, metadatos y enlaces sean válidos:

```bash
pnpm lint:skills
```

O para validar una skill específica:

```bash
node scripts/lint-skills.mjs skills/devops/mi-nueva-skill
```

---

## 📋 Criterios de Aceptación para Pull Requests

Para que una skill sea aceptada en el hub central:

1. **Pasa el Linter**: Validación de schema YAML sin errores ni advertencias críticas.
2. **Progressive Disclosure**: La descripción en el frontmatter no debe sobrecargar el contexto inicial.
3. **Determinismo**: Las instrucciones del flujo de trabajo deben ser claras, secuenciales y sin ambigüedades.
4. **Seguridad**: No debe incluir scripts o instrucciones que ejecuten operaciones destructivas sin salvaguardas o confirmación explícita.
5. **Agnosticismo**: No debe depender de características propietarias de un solo agente a menos que se especifique en el campo `agents: [...]`.

---

## 📜 Licencia

Al contribuir a este repositorio, aceptas que tus contribuciones se distribuyan bajo la licencia MIT.
