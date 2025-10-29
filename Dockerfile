FROM node:20-slim AS base

ARG PROJECT_DIR

ENV DB_HOST=postgres \
    DB_PORT=5432 \
    APP_PORT=7001 \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"


RUN corepack enable \
    && yarn global add pm2

WORKDIR $PROJECT_DIR
COPY ./ $PROJECT_DIR
RUN chmod +x ./wait-for-it.sh 

RUN ln -sf /usr/share/zoneinfo/Asia/Singapore /etc/localtime \
    && echo 'Asia/Singapore' > /etc/timezone

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile 

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=build $PROJECT_DIR/node_modules $PROJECT_DIR/node_modules
COPY --from=build $PROJECT_DIR/dist $PROJECT_DIR/dist

EXPOSE $APP_PORT

ENTRYPOINT ./wait-for-it.sh $DB_HOST:$DB_PORT -- sh -c "NODE_ENV=production pnpm migration:run && pm2-runtime ecosystem.config.js"
