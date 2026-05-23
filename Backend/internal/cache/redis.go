package cache

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"hygienehub/src/models"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

type cacheItem struct {
	value      string
	expiration time.Time
}

type Redis struct {
	client      *redis.Client
	useInMemory bool
	memoryCache map[string]cacheItem
	mu          sync.RWMutex
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
		Addr:        addr + ":" + port,
		DB:          0,
		DialTimeout: 2 * time.Second,
		ReadTimeout: 2 * time.Second,
	})

	r := &Redis{
		client:      client,
		memoryCache: make(map[string]cacheItem),
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := client.Ping(ctx).Err()
	if err != nil {
		log.Printf("WARNING: Redis connection failed (%v). Falling back to in-memory cache.", err)
		r.useInMemory = true

		// Start in-memory cleanup goroutine
		go r.cleanupLoop()
	} else {
		log.Println("Successfully connected to Redis.")
	}

	return r
}

func (r *Redis) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		r.mu.Lock()
		now := time.Now()
		for k, v := range r.memoryCache {
			if !v.expiration.IsZero() && now.After(v.expiration) {
				delete(r.memoryCache, k)
			}
		}
		r.mu.Unlock()
	}
}

// Get gets a value from cache. Returns empty string and redis.Nil if key does not exist or has expired.
func (r *Redis) Get(ctx context.Context, key string) (string, error) {
	if r.useInMemory {
		r.mu.RLock()
		item, exists := r.memoryCache[key]
		r.mu.RUnlock()

		if !exists {
			return "", redis.Nil
		}
		if !item.expiration.IsZero() && time.Now().After(item.expiration) {
			r.mu.Lock()
			delete(r.memoryCache, key)
			r.mu.Unlock()
			return "", redis.Nil
		}
		return item.value, nil
	}
	val, err := r.client.Get(ctx, key).Result()
	if err != nil && err != redis.Nil {
		log.Printf("WARNING: Redis connection failed dynamically during GET (%v). Switching to in-memory cache.", err)
		r.mu.Lock()
		r.useInMemory = true
		r.mu.Unlock()
		return r.Get(ctx, key)
	}
	return val, err
}

// Set sets a value in cache with expiration
func (r *Redis) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if r.useInMemory {
		var strVal string
		switch v := value.(type) {
		case string:
			strVal = v
		case []byte:
			strVal = string(v)
		default:
			strVal = fmt.Sprintf("%v", v)
		}

		var expTime time.Time
		if expiration > 0 {
			expTime = time.Now().Add(expiration)
		}

		r.mu.Lock()
		r.memoryCache[key] = cacheItem{
			value:      strVal,
			expiration: expTime,
		}
		r.mu.Unlock()
		return nil
	}
	err := r.client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		log.Printf("WARNING: Redis connection failed dynamically during SET (%v). Switching to in-memory cache.", err)
		r.mu.Lock()
		r.useInMemory = true
		r.mu.Unlock()
		return r.Set(ctx, key, value, expiration)
	}
	return nil
}

// Del deletes keys from cache
func (r *Redis) Del(ctx context.Context, keys ...string) error {
	if r.useInMemory {
		r.mu.Lock()
		for _, key := range keys {
			delete(r.memoryCache, key)
		}
		r.mu.Unlock()
		return nil
	}
	err := r.client.Del(ctx, keys...).Err()
	if err != nil {
		log.Printf("WARNING: Redis connection failed dynamically during DEL (%v). Switching to in-memory cache.", err)
		r.mu.Lock()
		r.useInMemory = true
		r.mu.Unlock()
		return r.Del(ctx, keys...)
	}
	return nil
}
