package cache

import (
	"context"

	"github.com/redis/go-redis"
)

var ctx = context.Background()

type Redis struct{
	Client *redis.Client
}

func NewRedis() *Redis {
	client := redis.NewClient(&redis.Options{
		Addr:"127.0.0.1:6379",
		DB:0,
	})
	return &Redis{Client:client}
}