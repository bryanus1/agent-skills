# 🏛️ Flutter Feature-First Clean Architecture (`flutter-architecture`)

> **Clean Architecture Feature-First para Flutter. Guía el diseño modular en `lib/features/<feature>/` (`domain`, `data`, `presentation`) con BLoC/Cubit, Inyección de Dependencias (`GetIt`/`Injectable`), manejo funcional de errores con `Result` sealed class y pruebas unitarias con `mocktail` y `bloc_test`.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `flutter-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.1.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node`, `flutter`, `dart` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill flutter-architecture

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill flutter-architecture -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/flutter-architecture .agents/skills/flutter-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/flutter-architecture .claude/skills/flutter-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Andamiar una feature completa con BLoC**:
  > *"Estructura la feature de facturación (billing) con Clean Architecture y el modelo invoice en Flutter"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --model invoice`  
  > ➔ Genera las 3 capas (`domain`, `data`, `presentation`), contratos de repositorio con `Result`, BLoC con estados inmutables y tests unitarios con `mocktail`.

* **Andamiar con Cubit**:
  > *"Crea la feature del carrito de compras (cart) usando Cubit"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs cart --model cart_item --cubit`  
  > ➔ Genera la feature con `CartItemCubit`, estados sellados y suite de pruebas en `test/features/cart/`.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/flutter-architecture` o `.claude/skills/flutter-architecture`).

### [`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)

```bash
# Feature completa con BLoC, Domain, Data y Tests:
node <skill-dir>/scripts/scaffold-feature.mjs auth --model user

# Usando Cubit en lugar de BLoC:
node <skill-dir>/scripts/scaffold-feature.mjs cart --model cart_item --cubit

# Modo simulación sin escribir archivos (Dry Run):
node <skill-dir>/scripts/scaffold-feature.mjs billing --model invoice --dry-run

# Sobrescribir archivos existentes (solo con confirmación explícita):
node <skill-dir>/scripts/scaffold-feature.mjs billing --model invoice --force
```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, flujo de 10 pasos y reglas críticas para el agente.
- **[Feature-First Clean Architecture](references/feature-first-clean-architecture.md)**: Anatomía detallada de capas y límites de dependencia.
- **[BLoC & State Management](references/bloc-and-state-management.md)**: Convenciones de estados, eventos y `bloc_test`.
- **[Result Pattern & Error Handling](references/result-pattern-and-error-handling.md)**: Clase sellada `Result` de Dart 3 y `Failure`.
- **[Dependency Injection with GetIt](references/dependency-injection-get-it.md)**: Patrones de registro y ciclo de vida de dependencias.
