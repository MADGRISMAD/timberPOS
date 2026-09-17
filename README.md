# Timber

## Descripción
Timber es una plataforma web de gestión de salón para restaurantes, cafés y hostelería. Cada cliente configura su negocio (nombre, logo e información operativa) mediante un asistente inicial.

Stack: Vue.js (frontend), Express.js (backend) y MongoDB.

## Correr el programa
El proyecto funciona como monorepositorio. Todo se ejecuta desde la raíz.

### Paso 1: Instalación de dependencias
```bash
npm install
```
### Paso 2: Correr los scripts
En el `package.json` de la raíz existen 3 comandos:

> back:dev

> front:dev

> dev

Si quieres correr únicamente el backend:
```bash
npm run back:dev
```

Si es el frontend únicamente:
```bash
npm run front:dev
```

Ambas partes en conjunto:
```bash
npm run dev
```

## Configuración inicial
Al entrar por primera vez (o tras registrarte), Timber abre el **wizard de configuración** en `/setup` para definir:

- Nombre y tipo de negocio
- Logo
- Zona horaria y preferencias operativas

La configuración se guarda en la API (`/settings`) y también en el navegador como respaldo.

## Panel de control (estilo POS tablet)
Tras el setup entras a **Mesas** (pantalla principal tipo POS tablet):

- Barra inferior grande: Mesas · Pedido · Cocina · Caja
- Menú “Más”: resumen, waitlist, personal, configuración
- Mesas en tiles táctiles (verde libre / rojo ocupada)
- Pedido con botones grandes de productos

### Alcance actual
Incluye operación diaria: mesas, pedidos, cocina, caja, menú, personal, waitlist e invitaciones.

Aún no incluye (siguiente fase): inventario/recetas, nómina, gastos, proveedores ni multi-sucursal.

### Invitaciones por correo
En `backend/.env` configura SMTP (Resend, Gmail, etc.):

```bash
APP_URL=http://localhost:5173
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=Timber <noreply@tu-dominio.com>
```

Si SMTP no está definido, la invitación se crea igual y el enlace se imprime en la consola del backend.

## Todo se maneja desde la raíz ahora

### Notas extras
Si quieres agregar dependencias a los workspaces:
```bash
npm install -workspace (frontend, backend) (dependencia)
```

Ejemplo:
```bash
npm install -workspace frontend nodemon
```
Este comando instalará en el frontend la librería nodemon.


Tambien puedes acortar el anterior script de la siguiente forma:
```bash
npm install -w frontend nodemon
```
Funciona exactamente igual
