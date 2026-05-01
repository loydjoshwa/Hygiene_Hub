package cache

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

type Redis struct {
	Client *redis.Client
}

func NewRedis() *Redis {
	addr := os.Getenv("REDIS_HOST")
	if addr == "" {
		addr = "127.0.0.1"
	}
	port := os.Getenv("REDIS_PORT")
	if port == "" {
		port = "6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr: addr + ":" + port,
		DB:   0,
	})
	return &Redis{Client: client}
}