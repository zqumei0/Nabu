package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/zqumei0/Nabu/backend/internal/config"
)

type Server struct {
	httpServer *http.Server
	logger     *slog.Logger
}

func New(cfg config.Config, logger *slog.Logger) *Server {
	mux := http.NewServeMux()
	registerRoutes(mux, logger)

	return &Server{
		httpServer: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: loggingMiddleware(logger, mux),
		},
		logger: logger,
	}
}

func (s *Server) Start() error {
	s.logger.Info("starting server", "addr", s.httpServer.Addr)
	if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("shutting down server")
	return s.httpServer.Shutdown(ctx)
}
