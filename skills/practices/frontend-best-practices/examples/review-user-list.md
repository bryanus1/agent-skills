# Ejemplo: revisión de un componente de lista de usuarios

**Pedido:** "Revisa `UserList.tsx` y aplica buenas prácticas de frontend."

## Código de partida (resumido)

```tsx
export function UserList({ query }: { query: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [visible, setVisible] = useState<User[]>([]);

  useEffect(() => {                                   // línea 6
    fetch(`/api/users?q=${query}`).then(r => r.json()).then(setUsers);
  }, [query]);

  useEffect(() => {                                   // línea 10
    setVisible(users.filter(u => u.active));
  }, [users]);

  return (
    <ul>
      {visible.map((u, i) => (
        <li key={i} onClick={() => open(u.id)}>       // línea 17
          <img src={u.avatar} />                      // línea 18
          <div dangerouslySetInnerHTML={{ __html: u.bio }} />   // línea 19
        </li>
      ))}
    </ul>
  );
}
```

## Hallazgos

| # | Severidad | Área | Ubicación | Problema y efecto | Acción |
|---|---|---|---|---|---|
| 1 | Crítico | Seguridad | UserList.tsx:19 | `bio` es texto del usuario inyectado como HTML: XSS almacenado | Renderizar como texto `{u.bio}` (no hay formato rico en el diseño) |
| 2 | Crítico | Accesibilidad | UserList.tsx:17 | `<li onClick>` no es operable con teclado ni lector de pantalla | `<button type="button">` dentro del `<li>` |
| 3 | Importante | Datos | UserList.tsx:6 | `fetch` en efecto sin cancelación ni manejo de error: al escribir rápido, una respuesta antigua puede pisar la nueva; un fallo deja la lista vacía sin aviso | `AbortController`, estado de carga y error |
| 4 | Importante | Estado | UserList.tsx:10 | `visible` es estado derivado: render doble y posible desincronización | Calcular `users.filter(...)` en el render |
| 5 | Importante | Estado | UserList.tsx:17 | `key={i}` rompe el estado al filtrar/reordenar | `key={u.id}` |
| 6 | Importante | Accesibilidad | UserList.tsx:18 | `<img>` sin `alt` | `alt=""` (decorativa: el nombre está junto a ella) |
| 7 | Menor | Datos | UserList.tsx:7 | `query` sin `encodeURIComponent` | Codificar el parámetro |

## Decisiones de no aplicar

- **No se introduce TanStack Query**: el proyecto no lo usa y el componente tiene una sola petición; con `AbortController` se resuelve la carrera. Se recomienda si aparecen más peticiones.
- **No se añade `useMemo`** al filtrado: la lista es pequeña y no hay medición que lo justifique.
- **No se virtualiza**: la API devuelve páginas de 20 elementos.

## Resultado (fragmento)

```tsx
useEffect(() => {
  const controller = new AbortController();
  setStatus('loading');
  fetch(`/api/users?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((data: User[]) => { setUsers(data); setStatus('success'); })
    .catch(e => { if (e.name !== 'AbortError') setStatus('error'); });
  return () => controller.abort();
}, [query]);

const visible = users.filter(u => u.active);
```

## Reporte (resumen)

- **Aplicado:** 7 hallazgos corregidos; tests: ✅ 3/3.
- **No verificado:** recorrido con lector de pantalla y foco visible del nuevo botón (requiere navegador).
- **Fuera de alcance:** el diseño del estado vacío (decisión de producto).
