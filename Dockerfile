# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build for production
RUN npm run build

# API and HTML rendering stage
FROM node:22-alpine AS api
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY shared ./shared
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
RUN mkdir -p /app/uploads && chown node:node /app/uploads
ENV NODE_ENV=production PORT=6002 UPLOAD_DIR=/app/uploads
EXPOSE 6002
USER node
CMD ["node", "server/index.js"]

# Production Stage with Nginx
FROM nginx:alpine AS web

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP ports (4004 for Coolify, 80 as fallback)
EXPOSE 4004
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
