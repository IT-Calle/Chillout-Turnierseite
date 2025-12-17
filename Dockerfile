# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifest and install deps
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Ensure Vite builds with configurable base for container
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# Build the production bundle
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA routing and caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
