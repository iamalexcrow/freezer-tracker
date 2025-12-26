# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy built backend
COPY --from=backend-build /app/backend/dist ./dist

# Copy built frontend to public folder
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/freezer.db

EXPOSE 3000

CMD ["node", "dist/server.js"]
