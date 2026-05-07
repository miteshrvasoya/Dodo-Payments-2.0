FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY apps ./apps
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

# Copy migrations since tsc ignores raw SQL files
COPY src/migrations ./dist/src/migrations

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/src/index.js"]
