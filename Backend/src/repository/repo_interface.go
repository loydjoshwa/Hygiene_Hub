package repository

import "gorm.io/gorm"

type PgSQLRepository interface {
	Insert(req interface{}) (interface{}, error)
	FindOneWhere(obj interface{}, query string, args ...interface{}) (interface{}, error)
	FindAllWhere(obj interface{}, query string, args ...interface{}) (interface{}, error)
	UpdateByFields(obj interface{}, id interface{}, fields map[string]interface{}) error
	Delete(obj interface{}, id interface{}) error
	DeleteWhere(obj interface{}, query string, args ...interface{}) error
	FindByID(obj interface{}, id interface{}) (interface{}, error)
	FindAll(obj interface{}) (interface{}, error)
	Count(model interface{}, count *int64) error
	GetDB() *gorm.DB
}