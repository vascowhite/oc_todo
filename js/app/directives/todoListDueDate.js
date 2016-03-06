/**
 * Created by paul on 22/02/16.
 */
(function(){
    angular.module('todo').
    directive('todoListDueDate', ['TodoList', function todoListDueDate(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todolistDueDate'),
            scope: true,
            link: function(scope){
                scope.todoList = todoList;
            }
        };
    }]);
})();