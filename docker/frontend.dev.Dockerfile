FROM node:20-alpine

WORKDIR /app/frontend

COPY apps/frontend/package*.json ./
RUN npm install

# Source is mounted as a live volume at runtime
EXPOSE 5173

CMD ["./node_modules/.bin/vite", "--host", "0.0.0.0"]
