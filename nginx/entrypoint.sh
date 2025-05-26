#!/bin/sh
set -e

# Crear directorio para certificados si no existe
mkdir -p /etc/nginx/certs

# Verificar si el certificado ya existe
if [ ! -f /etc/nginx/certs/selfsigned.crt ]; then
    echo "Generando certificado autofirmado..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -subj "/C=ES/ST=Granada/L=Granada/O=HLANZ/OU=TFG/CN=ismael_carballo_martin/emailAddress=carballomartinismael@gmail.com" \
        -keyout /etc/nginx/certs/selfsigned.key \
        -out /etc/nginx/certs/selfsigned.crt
    echo "Certificado generado correctamente."
fi

# Ejecutar Nginx en primer plano
exec nginx -g "daemon off;"
