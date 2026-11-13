# Formularios y validación

## Comprobaciones

- **Validar en cliente y en servidor.** La validación del cliente es ergonomía; la del servidor es seguridad. Comparte el esquema (Zod) si el stack lo permite.
- **Errores junto a su campo**, asociados con `aria-describedby` y `aria-invalid`, con texto que diga cómo corregir; no solo cambiar el color del borde.
- **Estado de envío**: deshabilita o ignora el segundo envío mientras la petición está en curso; muestra progreso.
- **No pierdas lo que escribió el usuario** si el envío falla; conserva los valores y muestra el error.
- **Etiquetas visibles** (`<label htmlFor>`), tipos y `autocomplete` correctos (`type="email"`, `autocomplete="email"`), `inputMode` en móviles.
- **Éxito y error del servidor** comunicados (mensaje, foco), no solo con un toast que desaparece.
- Evita validar en cada pulsación campos que el usuario aún está escribiendo; valida al salir del campo y al enviar, y revalida en vivo después de un error.

## Controlado vs no controlado

Con muchos campos, prefiere la librería del proyecto (React Hook Form) o formularios no controlados con `FormData` antes que un `useState` por campo con renders en cada tecla.

```tsx
async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
  if (!parsed.success) return setErrors(parsed.error.flatten().fieldErrors);
  setStatus('submitting');
  const res = await save(parsed.data);
  setStatus(res.ok ? 'success' : 'error');
}
```

## Subidas y datos sensibles

Valida tipo y tamaño de archivo antes de subir (y de nuevo en el servidor). No registres en consola ni en analítica valores de campos sensibles (contraseñas, tarjetas).
