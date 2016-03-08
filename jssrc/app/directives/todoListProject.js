/**
 * Created by paul on 22/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoListProject', ['TodoList', function todoListProject(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistProject'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();