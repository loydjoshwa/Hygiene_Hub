package cache

import (
	"context"
	"hygienehub/src/models"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

type Redis struct {
	Client *redis.Client
}

func NewRedis(cfg *models.Config) *Redis {
	addr := cfg.Redis.Host
	if addr == "" {
		addr = "127.0.0.1"
	}
	port := cfg.Redis.Port
	if port == "" {
		port = "6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr: addr + ":" + port,
		DB:   0,
	})
	return &Redis{Client: client}
}