.PHONY: build run test docker-build

build:
	go build -o bin/api .

run:
	go run .

test:
	go test ./...

docker-build:
	docker build -t nabu-backend .
