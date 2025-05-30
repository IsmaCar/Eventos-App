#!/bin/sh
set -e

# Wait for the database to be ready
echo "Waiting for MySQL to be ready..."
max_tries=30
tries=0
while [ $tries -lt $max_tries ]; do
    if mysql -h database -u IsmaCar -psecret -e "SELECT 1" >/dev/null 2>&1; then
        break
    fi
    tries=$((tries + 1))
    echo "MySQL not ready yet. Retry $tries/$max_tries..."
    sleep 2
done

if [ $tries -eq $max_tries ]; then
    echo "MySQL did not become ready in time. Exiting."
    exit 1
fi
echo "MySQL is ready!"

# Generate JWT keys if they don't exist
echo "Checking JWT keys..."
if [ ! -f "/app/config/jwt/private.pem" ] || [ ! -f "/app/config/jwt/public.pem" ]; then
    echo "JWT keys not found. Installing dev dependencies temporarily..."
    composer install --optimize-autoloader --no-interaction
    echo "Generating JWT keys..."
    php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction || true
    chmod 644 /app/config/jwt/*.pem 2>/dev/null || true
    echo "Removing dev dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
    echo "JWT keys generated successfully."
else
    echo "JWT keys already exist."
fi

# Limpiar cache ahora que la base de datos está disponible
echo "Limpiando cache de Symfony..."
php bin/console cache:clear --env=prod --no-debug --quiet || true
php bin/console cache:warmup --env=prod --no-debug --quiet || true

# Check if migrations directory exists, if not create it
if [ ! -d "/app/migrations" ]; then
    mkdir -p /app/migrations
    echo "Created migrations directory"
fi

# Verificar si las tablas ya existen en la base de datos
echo "Verificando el estado de la base de datos..."
TABLES_EXIST=$(mysql -h database -u IsmaCar -psecret -e "SHOW TABLES FROM events" | wc -l)

if [ $TABLES_EXIST -gt 0 ]; then
    echo "La base de datos ya contiene tablas. Marcando migraciones existentes como ejecutadas..."
    # Marcar todas las migraciones existentes como ejecutadas
    php bin/console doctrine:migrations:version --add --all --no-interaction --quiet || true
    
    # Verificar si hay esquemas que no coinciden y actualizarlos
    echo "Verificando y actualizando el esquema si es necesario..."
    php bin/console doctrine:schema:update --force --quiet || true
else
    # Si no hay tablas, generar y ejecutar migraciones normalmente
    echo "Base de datos vacía. Generando y ejecutando migraciones..."
    # Generar migración inicial si es necesario
    php bin/console doctrine:migrations:diff --quiet || true
    
    # Ejecutar migraciones
    echo "Ejecutando migraciones..."
    php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration || true
    
    # En caso de error en migraciones, intentar con schema update
    if [ $? -ne 0 ]; then
        echo "Error en las migraciones, usando schema update como alternativa..."
        php bin/console doctrine:schema:update --force --quiet || true
    fi
fi

# Start the Symfony server
exec php -S 0.0.0.0:8000 -t public
