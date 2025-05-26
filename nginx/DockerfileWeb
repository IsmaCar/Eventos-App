FROM nginx:latest
# Instala openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# Copia la configuración de Nginx
COPY default.conf /etc/nginx/conf.d/default.conf
# Copia el script de entrypoint y asigna permisos de ejecución
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# Define el script de entrada como comando predeterminado
CMD ["/entrypoint.sh"]