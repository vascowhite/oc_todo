/**
 * Created by paul on 09/02/16.
 */
'use strict';
(function(){
    angular.module('todo', ['ngRoute'])
        .config(['$httpProvider', function($httpProvider){
            $httpProvider.defaults.headers.common.requesttoken = OC.requestToken;
    }])
        .config(['$routeProvider', function($routeProvider){
            $routeProvider.
            when('/File', {
                template: "<todo-list-file></todo-list-file>"
            }).
            when('/Alpha', {
                template: "<todo-list-alpha></todo-list-alpha>"
            }).
            when('/Priority', {
                template: "<todo-list-priority></todo-list-priority>"
            }).
            when('/Project', {
                template: "<todo-list-project></todo-list-project>"
            }).
            when('/Context', {
                template: "<todo-list-context></todo-list-context>"
            }).
            when('/DueDate', {
                template: "<todo-list-due-date></todo-list-due-date>"
            }).
            otherwise({
                redirectTo: '/File'
            });
        }])
        .run(['$route', function($route){
            /**
             * Work around for https://github.com/angular/angular.js/issues/1213
             * and https://github.com/angular/angular.js/issues/6812
             */
            $route.reload();
        }]);
})();