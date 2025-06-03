# Sistema de Control de Acceso (SCA)

## Descripción
El Sistema de Control de Acceso (SCA) es una aplicación web desarrollada en Angular que proporciona una plataforma robusta para la gestión y control de accesos. La aplicación utiliza Supabase como backend y está construida con las mejores prácticas de desarrollo moderno.

## Tecnologías Principales
- Angular 17
- TypeScript
- Supabase
- Tailwind CSS
- Angular Material

## Estructura del Proyecto

### Componentes Principales
La aplicación está organizada en varios módulos y componentes:

- **Componentes de Autenticación**
  - Login
  - Registro
  - Recuperación de contraseña

- **Componentes de Gestión**
  - Áreas de Decisión
  - Opciones
  - Comparaciones
  - Vínculos

### Servicios
Los servicios están organizados en diferentes categorías:

#### Servicios de Supabase
- `supabaseServices/`: Contiene todos los servicios relacionados con la interacción directa con Supabase

#### Servicios de Aplicación
- `auth.service.ts`: Gestión de autenticación
- `decision-area.service.ts`: Gestión de áreas de decisión
- `selected-path.service.ts`: Gestión de rutas seleccionadas
- `comparision-mode.service.ts`: Gestión del modo de comparación

### Modelos
Los modelos principales están definidos en:

- `interfaces.ts`: Interfaces principales del sistema
- `opcion.ts`: Modelo de opciones
- `decision.ts`: Modelo de decisiones
- `comparacion.ts`: Modelo de comparaciones
- `vinculo.ts`: Modelo de vínculos

## Configuración del Proyecto

### Requisitos Previos
- Node.js (versión 16 o superior)
- npm (versión 7 o superior)
- Angular CLI

### Instalación
1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Crear un archivo `.env` en la raíz del proyecto
   - Configurar las variables de Supabase necesarias

4. Iniciar el servidor de desarrollo:
```bash
ng serve
```

## Características Principales

### Gestión de Áreas de Decisión
- Creación y edición de áreas de decisión
- Asignación de opciones
- Gestión de comparaciones

### Sistema de Comparación
- Comparación de opciones
- Matriz de comparación
- Cálculo de prioridades

### Gestión de Vínculos
- Creación de vínculos entre opciones
- Visualización de relaciones
- Análisis de dependencias

## Contribución
1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto
[Tu Nombre] - [Tu Email]

Link del Proyecto: [https://github.com/tu-usuario/nombre-del-proyecto](https://github.com/tu-usuario/nombre-del-proyecto)
