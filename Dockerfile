FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY scripts/fetch-local-model.mjs scripts/fetch-local-model.mjs
RUN npm run models:fetch
COPY . .
ARG PUBLIC_GA_MEASUREMENT_ID=""
ARG PUBLIC_GOOGLE_SITE_VERIFICATION=""
ARG PUBLIC_BING_SITE_VERIFICATION=""
ENV PUBLIC_GA_MEASUREMENT_ID=${PUBLIC_GA_MEASUREMENT_ID}
ENV PUBLIC_GOOGLE_SITE_VERIFICATION=${PUBLIC_GOOGLE_SITE_VERIFICATION}
ENV PUBLIC_BING_SITE_VERIFICATION=${PUBLIC_BING_SITE_VERIFICATION}
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health.txt >/dev/null || exit 1
