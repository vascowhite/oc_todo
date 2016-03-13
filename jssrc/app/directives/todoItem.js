/**
 * Created by paul on 21/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoItem', ['TodoList', function todoItem(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistItem'),
            controller: function(){

                this.doTodo = function(todoNum){
                    todoList.doTodo(todoNum);
                };

                this.archive = function(todoNum){
                    todoList.archive(todoNum);
                };

                this.delete = function(todoNum){
                    todoList.delete(todoNum);
                };
            },
            controllerAs: 'todoItemCtrl'
        };
    }]);
})();