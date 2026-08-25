package server

import (
	"log/slog"
	"net/http"
)

func registerRoutes(mux *http.ServeMux, logger *slog.Logger) {
	mux.HandleFunc("GET /health", healthHandler)
}
