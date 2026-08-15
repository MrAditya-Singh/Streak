# ⚡ Multi-Stage Production Dockerfile for Streak Backend
FROM node:24-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start backend with Node.js
CMD ["node", "src/server.js"]
