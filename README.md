# Memento - Sistema de Gestión de Eventos

## Descripción del Proyecto

**Memento** es una aplicación web completa para la gestión de eventos sociales desarrollada como Trabajo de Fin de Grado. La aplicación permite a los usuarios crear, gestionar y participar en eventos, así como mantener redes sociales con otros usuarios a través de invitaciones y sistema de amistad.

### Características Principales

- **Autenticación JWT** - Sistema seguro de registro y login
- **Gestión de Usuarios** - Perfiles personalizables con avatares
- **Eventos** - Creación y gestión de eventos
- **Ubicaciones** - Integración con Google Maps para localización
- **Galería de Fotos** - Subida y gestión de imágenes por evento
- **Fotos Favoritas** - Sistema de favoritos para fotos
- **Sistema de Amistad** - Envío de solicitudes y gestión de amigos
- **Invitaciones** - Invitar usuarios a eventos con estados de respuesta
- **Panel de Administración** - Gestión completa para administradores

## Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- React 19.0.0 con Vite
- TailwindCSS 4.1.4 para estilos
- Google Maps API para ubicaciones
- React Router DOM para navegación

**Backend:**
- PHP 8.2 con Symfony 7.0
- JWT Authentication con LexikJWTAuthenticationBundle
- Doctrine ORM para base de datos
- CORS configurado para desarrollo

**Base de Datos:**
- MySQL 8.0
- phpMyAdmin para administración

**Infraestructura:**
- Docker Compose para orquestación
- Nginx como proxy reverso
- Volúmenes persistentes para datos

## Instrucciones de Instalación y Despliegue

### Prerrequisitos

- **Docker** y **Docker Compose** instalados
- **Git** para clonar el repositorio
- **Puerto 5173** (Frontend), **8000** (Backend), **3306** (MySQL), **8080** (phpMyAdmin) disponibles

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/IsmaCar/Eventos-App]
cd Eventos-App
```

### 2. Configuración del Entorno

El proyecto incluye configuración automática a través de Docker. No se requiere configuración manual adicional.

### 3. Lanzar la Aplicación

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano (opcional)
docker-compose up -d --build
```

### 4. Verificar la Instalación

La aplicación estará disponible a nivel local en:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **phpMyAdmin**: http://localhost:8080
- *modificar puerto servidor en docker-compose, por defecto p 8020* 
- **Nginx (Proxy)**: https://localhost

La aplicación estará disponible deplegada en:
- **Nginx (Proxy)**: https://52.4.36.65/
- **Backend API**: http://52.4.36.65:8000/api (API Platform)
- **EndPoints**: http://52.4.36.65:8000
- **phpMyAdmin**: https://52.4.36.65/phpmyadmin


## Credenciales de Acceso

### Base de Datos MySQL
- **Host**: localhost:3306
- **Usuario**: `IsmaCar`
- **Contraseña**: `secret`
- **Base de datos**: `events`

### phpMyAdmin
- **URL**: http://localhost:8080
- **Usuario**: `IsmaCar`
- **Contraseña**: `secret`

### Usuarios de Prueba

La aplicación incluye **datos de prueba** preconfigurados:

#### Usuario Administrador
- **Email**: `admin@eventos.com`
- **Contraseña**: `lur123`
- **Rol**: Administrador

#### Usuarios Normales
- **Email**: `user1@eventos.com` a `user9@eventos.com`
- **Contraseña**: `lur123` (para todos)
- **Rol**: Usuario

#### Ejemplos de usuarios específicos:
- **María García**: `maria.garcia@email.com` - `lur123`
- **Carlos López**: `carlos.lopez@email.com` - `lur123`
- **Ana Martín**: `ana.martin@email.com` - `lur123`

## Datos de Prueba Incluidos

El sistema incluye un conjunto completo de datos de prueba:

### Usuarios (10 registros)
- 1 administrador + 9 usuarios normales
- Todos con contraseña `lur123`
- Perfiles con nombres, emails y biografías realistas

### Eventos (10 registros)
- Variedad de eventos: conferencias, festivales, workshops, etc.
- Fechas futuras distribuidas en los próximos 6 meses
- Diferentes organizadores y capacidades

### Ubicaciones (5 registros)
- Ciudades españolas: Madrid, Barcelona, Valencia, Sevilla, Bilbao
- Coordenadas GPS reales para integración con mapas

### Invitaciones (10 registros)
- Estados diversos: pendiente, aceptada, rechazada
- Relaciones cruzadas entre diferentes usuarios

### Fotos (15 registros)
- Imágenes distribuidas entre eventos
- Diferentes usuarios como autores

### Fotos Favoritas (10 registros)
- Usuarios marcando fotos como favoritas
- Simula interacción real del sistema

### Amistades (10 registros)
- Estados variados: aceptada, pendiente, rechazada
- Red social realista entre usuarios

## Configuración Automática

### Docker Setup
- **Migración automática** de base de datos al iniciar
- **Generación automática** de claves JWT
- **Creación automática** de carpetas de uploads
- **Inserción automática** de datos de prueba

### Volúmenes Persistentes
- `database_data`: Datos de MySQL
- `backend_vendor`: Dependencias de Composer
- `backend_uploads`: Archivos subidos (avatares, fotos)

## Endpoints de la API
- Todos los endpoints se encuentran en la url http://localhost:8000

## Funcionalidades de la Aplicación

### Para Usuarios Regulares
1. **Registro y Perfil**
   - Crear cuenta con email único
   - Personalizar perfil con avatar y biografía
   - Visualizar perfiles de otros usuarios

2. **Gestión de Eventos**
   - Crear eventos con detalles completos
   - Eliminar eventos
   - Ver lista de todos los eventos disponibles
   - Ver detalles específicos de cada evento
   - Invitar usuarios de la app a los eventos

3. **Sistema Social**
   - Enviar y recibir solicitudes de amistad
   - Gestionar lista de amigos
   - Responder a invitaciones recibidas

4. **Galería de Fotos**
   - Subir fotos a eventos
   - Ver galerías de todos los eventos
   - Marcar fotos como favoritas
   - Gestionar fotos favoritas

### Para Administradores
- **Panel de Administración** completo
- **Gestión de usuarios** y eventos
- **Moderación de contenido**
- **Acceso a estadísticas del sistema**


## Comandos de Gestión nivel Local

### Docker
```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs [servicio]

# Reiniciar un servicio
docker-compose restart [servicio]

# Parar todos los servicios
docker-compose down

# Limpiar volúmenes
docker-compose down -v
```

