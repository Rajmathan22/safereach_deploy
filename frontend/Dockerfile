FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_SAFEREACH_API_URL=/api/v1
ARG VITE_SAFEREACH_WS_URL=
ENV VITE_SAFEREACH_API_URL=$VITE_SAFEREACH_API_URL
ENV VITE_SAFEREACH_WS_URL=$VITE_SAFEREACH_WS_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

