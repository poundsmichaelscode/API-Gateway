FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S gateway && adduser -S gateway -G gateway
COPY --from=build --chown=gateway:gateway /app/dist ./dist
COPY --from=build --chown=gateway:gateway /app/node_modules ./node_modules
COPY --from=build --chown=gateway:gateway /app/package.json ./package.json
USER gateway
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
