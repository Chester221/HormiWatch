FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install

COPY backend/ ./backend/

RUN cd backend && npm run build

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/main"]