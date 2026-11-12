# Checklist de Ejecución (IDD Apply)

Formato de las marcas que `idd-apply` escribe.

- **Plan en un tracker:** el progreso va en comentarios del ítem y el cuerpo se consolida una sola vez al cerrar.
- **Plan en `.md` local:** todo se marca directamente en el archivo.

---

## Estados del plan

La línea de estado está al inicio de `## 🛠️ Plan de Implementación`. En el tracker, los estados intermedios se comunican en los comentarios y en el cuerpo solo cambia de `planificado` a `implementado` al cerrar.

| Estado | Cuándo |
|---|---|
| `Estado: planificado` | Lo deja `idd-plan` |
| `Estado: en progreso` | Al empezar la primera tarea |
| `Estado: bloqueado — <motivo>` | Si hay que parar a la espera de una decisión |
| `Estado: implementado · <YYYY-MM-DD>` | Tras la verificación final y el OK del usuario |

## Casillas

- `- [ ]` pendiente · `- [x]` hecha y verificada.
- Una tarea que no se pudo verificar queda `- [ ]` con una nota: `- [ ] 2.1 … → R1 _(pendiente: falla el test X)_`.
- Las tareas añadidas durante la implementación se numeran a continuación (`1.3`, `1.4`…) y llevan `_(añadida)_`.

## Comentario de progreso (tracker)

Un comentario por grupo de tareas, y siempre uno antes de terminar el turno:

```markdown
🔄 Progreso IDD — en progreso

**Completadas:** 1.1, 1.2
**Verificación:** `pnpm test invoices` ✅
**Siguiente:** 2.1
**Desviación:** (ninguna) | Tarea 1.2 usa `paginateAll` en vez de `find` (acordado con el usuario)
```

Al retomar, las tareas listadas en estos comentarios cuentan como hechas aunque el cuerpo siga en `- [ ]`.

Al cerrar, último comentario: `✅ IDD — implementado` con el resumen de cierre.

## Desviaciones

Si el resultado difiere del plan, añadir al final del plan (en el tracker, al consolidar el cuerpo en el cierre):

```markdown
### Desviaciones
- **Tarea 1.2:** se usó `paginateAll` en lugar de `find` porque `find` limita a 100 filas. Acordado con el usuario el 2026-11-12.
- **R2:** el límite pasó de 10 000 a 5 000 filas (decisión de producto).
```

## Antes de pasar a la siguiente tarea

- [ ] El cambio se limita a lo que pide la tarea.
- [ ] Sigue los patrones existentes del repo.
- [ ] La verificación de la tarea pasó.
- [ ] El avance está registrado (casilla en local, o incluido en el próximo comentario de progreso en el tracker).

## Resumen de cierre (en el chat)

```markdown
**Plan:** <enlace o ruta> — Estado: implementado
**Tareas:** 6/6 completadas
**Archivos:** `src/a.ts`, `src/a.spec.ts`
**Verificación:** `pnpm test invoices` ✅ · `pnpm lint` ✅
**Desviaciones:** 1 (ver plan)
**Pendiente:** commit/PR cuando lo indiques
```
