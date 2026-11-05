FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
# npm install (no ci): evita fallos si el lockfile queda ligeramente desfasado en el servidor
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
