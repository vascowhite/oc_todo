/**
 * Created by paul on 22/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoListAlpha', ['TodoList', function todoListAlpha(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistAlpha'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();