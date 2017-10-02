import EventEmitter from 'events'

angular.module('beeline')
.factory('MapService', () => new EventEmitter())
