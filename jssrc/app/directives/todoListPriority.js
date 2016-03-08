/**
 * Created by paul on 22/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoListPriority', ['TodoList', function todoListPriority(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistPriority'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();