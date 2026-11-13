# Seguridad en el backend

Basado en el OWASP Top 10 y ASVS. Lo más frecuente y de más impacto, en este orden.

## 1. Autorización por recurso (el fallo más común)

No basta con "está autenticado". En cada operación sobre un recurso, comprueba que **este usuario puede actuar sobre este recurso**:

```ts
const order = await orders.findById(id);
if (!order || order.userId !== user.id) return notFound();   // IDOR: no devuelvas el pedido de otro
```

- Deniega por defecto; los permisos se comprueban en el servidor en cada petición (guards/middleware + comprobación de propiedad en el servicio).
- No confíes en identificadores ni roles que envía el cliente (`userId` en el cuerpo): sácalos de la sesión o del token verificado.

## 2. Inyección

- **SQL/NoSQL**: consultas parametrizadas; en MongoDB, no pases objetos del usuario directamente al filtro (`$ne`, `$gt`).
- **Comandos del sistema**: evita `exec` con entrada del usuario; usa `execFile` con argumentos separados.
- **Rutas de archivos**: normaliza y comprueba que queda dentro del directorio permitido (path traversal).
- **SSRF**: si el servidor descarga URLs dadas por el usuario, valida el destino (lista permitida, bloquea rangos internos y metadatos de la nube).

## 3. Autenticación y sesiones

- Contraseñas con **argon2id** o bcrypt (coste adecuado), nunca hash rápido ni cifrado reversible.
- Tokens/JWT: verifica firma, expiración y audiencia; tiempos de vida cortos; rotación de refresh tokens; revocación posible.
- Cookies de sesión `HttpOnly; Secure; SameSite`.
- Limita intentos de inicio de sesión (límite de tasa y bloqueo progresivo); mensajes de error que no revelen si el usuario existe.

## 4. Datos sensibles y secretos

- Secretos **solo en variables de entorno o gestor de secretos**; nunca en el repositorio, en los logs ni en las respuestas. Si encuentras uno en el código, repórtalo como crítico y recomienda rotarlo (ya está comprometido).
- Cifra en tránsito (TLS) y datos especialmente sensibles en reposo.
- No devuelvas más campos de los necesarios; excluye `passwordHash`, tokens, notas internas.
- No registres contraseñas, tokens, números de tarjeta ni datos personales completos.

## 5. Protección frente a abuso

- **Límite de tasa** por IP/usuario en endpoints sensibles (login, registro, recuperación, envío de correos/SMS).
- Límites de tamaño de cuerpo y de subida; tipos de archivo permitidos; analiza o aísla las subidas.
- CORS con orígenes explícitos (no `*` con credenciales); cabeceras de seguridad (`helmet` o equivalente).

## 6. Dependencias

- Auditar (`npm audit`, Dependabot/Renovate), fijar versiones con lockfile, no ejecutar scripts de origen desconocido. No actualices masivamente sin confirmar.
