package config

import "testing"

func TestLoad(t *testing.T) {
	tests := []struct {
		name         string
		envPort      string
		envLogLevel  string
		wantPort     string
		wantLogLevel string
	}{
		{
			name:         "defaults",
			wantPort:     "8080",
			wantLogLevel: "info",
		},
		{
			name:         "overrides",
			envPort:      "9090",
			envLogLevel:  "debug",
			wantPort:     "9090",
			wantLogLevel: "debug",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("PORT", tt.envPort)
			t.Setenv("LOG_LEVEL", tt.envLogLevel)

			cfg, err := Load()
			if err != nil {
				t.Fatalf("Load() returned error: %v", err)
			}
			if cfg.Port != tt.wantPort {
				t.Errorf("Port = %q, want %q", cfg.Port, tt.wantPort)
			}
			if cfg.LogLevel != tt.wantLogLevel {
				t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, tt.wantLogLevel)
			}
		})
	}
}
