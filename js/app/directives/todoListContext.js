/**
 * Created by paul on 22/02/16.
 */
(function(){
    angular.module('todo').
    directive('todoListContext', ['TodoList', function todoListContext(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistContext'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();