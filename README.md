# Vendfy Super Admin

Panel de plataforma: lo que vemos **nosotros** sobre todos los comercios, no lo
que ve un comerciante sobre el suyo.

Su razón de ser a mediano plazo es el módulo **Workflow IA** — el depurador
visual de la IA, que además es el instrumento de medición del Taller de Grado
(RNF-11, RNF-12 y OE-7). El plan completo por fases está en
[`../SUPER-ADMIN.md`](../SUPER-ADMIN.md).

## Estado

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Esqueleto, login por rol, listado de negocios con filtros | ✅ |
| 1 | Ganancias, alta de negocios, usuarios | pendiente |
| 2 | Tablas de traza + instrumentación del agente de WhatsApp | pendiente |
| 3 | El grafo de nodos y el Studio | pendiente |
| 4 | Los nodos del omnibox del comerciante | pendiente |

## Arrancar

```bash
npm install
cp .env.example .env     # apunta a http://localhost:3001 por defecto
npm run dev              # http://localhost:5174
```

Hace falta el backend (`ventas-service`) corriendo. Se entra con una cuenta cuyo
rol sea **Super Administrador**; cualquier otra recibe 403 del backend y ni
siquiera pasa del login.

## Pruebas

```bash
npm run typecheck     # TypeScript
npm run test:logic    # lógica pura, sin navegador ni backend — milisegundos
npm run test:e2e      # navegador real contra un backend real
```

Los E2E levantan la app solos. El backend NO: se espera que esté corriendo,
porque puede estar apuntando a datos que una prueba no debe arrancar ni detener
por su cuenta.

Para apuntar a otra instancia del backend:

```bash
E2E_API_URL=http://localhost:3099 npm run test:e2e
```

Variables que aceptan los tests (todas con valor por defecto de desarrollo):
`E2E_API_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_STORE_EMAIL`,
`E2E_STORE_PASSWORD`.

## Arquitectura

Vite + React + TypeScript con **Feature-Sliced Design**, igual que
`ecommerce-frontend`, para que mover un componente de un proyecto al otro no
cueste nada.

```
src/
  app/        providers (auth, react-query), guards, router
  entities/   dominio: api/ + model/  (negocio, …)
  features/   una carpeta por pantalla (login, negocios, …)
  shared/     api/, hooks/, ui/ (shadcn), lib/
  widgets/    layout
e2e/
  flows/      pruebas con navegador
  logic/      pruebas puras
  helpers/    env y utilidades
```

### Vite y no Next

El super-admin de glow es Next porque necesita un servidor que guarde un secreto
compartido con el motor del bot. Acá no hace falta: `ventas-service` ya
autentica con JWT y ya tiene roles, así que este panel es un cliente más de la
API y el backend decide qué puede ver. Una sola variable de entorno, sin proxy.

### Dos cosas que conviene saber antes de tocar el código

**La sesión usa claves propias** (`vendfyAdminToken`), no las del panel de
comercios. En desarrollo los dos proyectos corren en `localhost`, que para el
navegador es el mismo origen: con claves compartidas, entrar acá cerraría la
sesión del otro.

**`setFiltro` dos veces seguidas pierde la primera.** React Router no refleja lo
que acabás de escribir en la dirección hasta el siguiente render, así que la
segunda llamada parte del estado viejo. Si dos filtros son en realidad una sola
decisión del usuario, modelalos como un filtro (ver `orden` en la pantalla de
Negocios).
