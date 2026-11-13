# Estado, efectos y datos remotos

## Contenido

1. [Estado derivado](#estado-derivado)
2. [Cuándo usar un efecto](#cuándo-usar-un-efecto)
3. [Carreras y limpieza](#carreras-y-limpieza)
4. [Datos remotos](#datos-remotos)
5. [Listas y claves](#listas-y-claves)
6. [Dónde vive el estado](#dónde-vive-el-estado)

## Estado derivado

**Señal:** `useEffect(() => setX(f(y)), [y])`. Dos renders por cada cambio y estados que pueden desincronizarse.

```tsx
// Evitar
const [filtered, setFiltered] = useState<User[]>([]);
useEffect(() => setFiltered(users.filter(u => u.active)), [users]);

// Preferir: se calcula en el render
const filtered = users.filter(u => u.active);
// Con coste medido alto: useMemo(() => users.filter(...), [users])
```

Regla: si un valor se puede calcular a partir de props o estado, **no es estado**. Tampoco copies props a estado salvo para un valor inicial editable (y entonces nómbralo `initialX`).

## Cuándo usar un efecto

Un efecto sincroniza el componente con algo **externo** al render: suscripciones, temporizadores, listeners del DOM, librerías de terceros, analítica al montar. No es para:

- Reaccionar a un evento del usuario: pon la lógica en el **manejador del evento**.
- Transformar datos para renderizar: cálculo en el render.
- Reiniciar estado al cambiar una prop: usa `key` en el componente.
- Obtener datos si el proyecto tiene TanStack Query, SWR o loaders del framework.

Dependencias: incluye todo lo que el efecto lee. Si el linter (`react-hooks/exhaustive-deps`) avisa, corrige la causa; no la silencies con un comentario.

## Carreras y limpieza

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();   // al cambiar `id` se cancela la petición anterior
}, [id]);
```

Toda suscripción, temporizador o listener devuelve su limpieza. En desarrollo, React 18 monta dos veces con StrictMode: si el efecto rompe, le falta limpieza.

## Datos remotos

- Con la librería de datos del proyecto: `useQuery({ queryKey: ['user', id], queryFn })`. Aporta caché, reintentos, cancelación y deduplicación.
- Modela el estado asíncrono explícitamente: **cargando, error, vacío, éxito**. Un componente que solo pinta el caso feliz es un bug pendiente.
- Mantén separados el **estado del servidor** (usuarios, pedidos) y el **estado de UI** (modal abierto, pestaña): cada uno con su herramienta.
- Tras una mutación, invalida o actualiza la caché en lugar de refetch manual disperso.
- En frameworks con componentes de servidor, obtén los datos en el servidor y pásalos como props; reserva el cliente para la interactividad.

## Listas y claves

- `key` estable y única (id del dato). `key={index}` rompe el estado interno al reordenar, insertar o filtrar.
- Listas de cientos de filas o más: paginar o virtualizar (ver [performance](performance.md)).

## Dónde vive el estado

Sube el estado solo hasta el ancestro común más cercano. Contexto para datos de "ambiente" (tema, sesión) que cambian poco; un store (Zustand, Redux) cuando muchos componentes lejanos lo comparten y cambia a menudo. No metas en un store global lo que es local a un formulario o a un diálogo.
