FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including devDependencies for nodemon/ts-node)
COPY package*.json ./
RUN npm install

# Source is mounted as a volume at runtime via docker-compose.dev.yml
# tsx watch will hot-reload on any .ts file change

EXPOSE 3001

CMD ["./node_modules/.bin/nodemon", "--legacy-watch", "--watch", "apps/mock-psp", "--ext", "ts,json", "--exec", "./node_modules/.bin/tsx apps/mock-psp/index.ts"]
