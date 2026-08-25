package config

import "os"

type Config struct {
	Port     string
	LogLevel string
}

func Load() (Config, error) {
	cfg := Config{
		Port:     "8080",
		LogLevel: "info",
	}

	if v := os.Getenv("PORT"); v != "" {
		cfg.Port = v
	}
	if v := os.Getenv("LOG_LEVEL"); v != "" {
		cfg.LogLevel = v
	}

	return cfg, nil
}
