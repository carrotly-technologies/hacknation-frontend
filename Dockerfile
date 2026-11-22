# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Backend base URL baked into the bundle at build time (empty = same origin).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
# "false" hides the demo accounts on the sign-in page.
ARG VITE_DEMO_ACCOUNTS=""
ENV VITE_DEMO_ACCOUNTS=$VITE_DEMO_ACCOUNTS
RUN npm run build

# ---- runtime ----
FROM nginx:1.30-alpine AS runtime
# `apk upgrade` pulls Alpine security fixes released after the base image.
# Run nginx as the unprivileged "nginx" user: the pid file goes to /tmp and the
# cache dirs belong to nginx. Port 80 still works, because Docker lets
# non-root processes bind low ports inside the container
# (net.ipv4.ip_unprivileged_port_start=0).
RUN apk upgrade --no-cache \
  && sed -i -e 's,^pid .*,pid /tmp/nginx.pid;,' -e '/^user /d' /etc/nginx/nginx.conf \
  && chown -R nginx:nginx /var/cache/nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
