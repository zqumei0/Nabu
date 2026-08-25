# syntax=docker/dockerfile:1
FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api .

FROM alpine:3.20
RUN addgroup -S nabu && adduser -S nabu -G nabu
COPY --from=builder /out/api /usr/local/bin/api
USER nabu
# 8080 is a conventional default, not yet an ECS task-definition contract
# (no CDK/ECS stack exists in infra/ yet to pin this down).
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/api"]
