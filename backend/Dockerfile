FROM rust:1.82-slim as rustbuilder
WORKDIR /usr/src/comicseeder
COPY ./backend .

RUN apt update && apt install libssl-dev libpq-dev pkg-config -y && cargo install --path .

FROM node:16-buster-slim as nodebuilder
WORKDIR /usr/src/app
COPY ./frontend .

RUN npm install && npm run build-only

FROM debian:buster-slim
WORKDIR /usr/local/share/comicseeder
RUN apt-get update && apt-get install -y libssl1.1 libpq5 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=rustbuilder /usr/local/cargo/bin/comicseeder /usr/local/bin/comicseeder
COPY --from=nodebuilder /usr/src/app/dist /usr/local/share/comicseeder-front/dist
COPY ./entry-point.sh .
CMD ["sh", "./entry-point.sh"]