FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./

RUN apk add --no-cache python3 make g++

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build:docker

FROM oven/bun:1-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

EXPOSE 3000

CMD ["bun", "dist-server/prod-server.js"]