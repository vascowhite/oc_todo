/**
 * Created by paul on 22/02/16.
 */
(function(){
    angular.module('todo').
    directive('todoListFile', ['TodoList', function todoListFile(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistFile'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();