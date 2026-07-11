# RURAQ Web

Landing de demostración del robot social **RURAQ**, con viewer 3D interactivo.

## Arranque local

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

## Modelo 3D

- Fuente: `public/models/ruraq_obj.obj` + `.mtl`
- Optimizado para web: `public/models/ruraq.glb`

### Controles del viewer

Inspirado en viewers Three.js de museo (iluminación dramática, bloom y preloader):

- **Auto-giro:** el robot gira suavemente como vitrina de producto.
- **Arrastre horizontal:** corrige la rotación; tras soltar, retoma el giro tras ~2 s de inactividad.
- **Scroll:** zoom suave.
- **Sin inclinación vertical:** la cámara permanece fija para que el robot no se vea de cabeza.

### Rendimiento

El viewer ajusta calidad automáticamente según dispositivo:

- **Alto (desktop):** bloom, HDR de estudio, sombras de contacto en mayor resolución.
- **Medio (tablet / pantallas pequeñas):** sin bloom, HDR reducido.
- **Bajo (móvil / `prefers-reduced-motion`):** sin HDR ni postprocesado, DPR fijo en 1.

Además:

- Pausa el render cuando el canvas no está visible o la pestaña está en segundo plano.
- Baja el DPR si los FPS caen (`performance` de React Three Fiber).
- Separa Three.js y postprocesado en chunks distintos al hacer build.

Para mejorar aún más, comprime el modelo con [glTF-Transform](https://gltf-transform.dev/) o Draco antes de desplegar.

## Despliegue con Docker

Requisito: la red Docker de Nginx Proxy Manager debe existir:

```bash
docker network ls | grep nginx-proxy-manager_default
```

### Build y arranque

```bash
docker compose up -d --build
```

El contenedor `ruraq-web` escucha en el puerto **80** interno y se conecta a la red `nginx-proxy-manager_default`. No expone puertos en el host.

### Configuración en Nginx Proxy Manager

1. **Proxy Hosts** → **Add Proxy Host**
2. **Domain Names:** tu dominio (ej. `ruraq.tudominio.com`)
3. **Forward Hostname / IP:** `ruraq-web`
4. **Forward Port:** `80`
5. Activar SSL (Let's Encrypt) si aplica

### Verificación

```bash
docker compose ps
docker exec ruraq-web wget -qO- http://127.0.0.1
```

Tras configurar el proxy, abre el dominio y confirma que carga el modelo en `/models/ruraq.glb`.
