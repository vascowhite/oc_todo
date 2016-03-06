/**
 * Created by paul on 21/02/16.
 */
(function(){
    angular.module('todo').
    directive('todoAddNew', ['TodoList', function todoAddNew(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todoAddNew'),
            controller: function(){
                this.newTodo = '';

                var self = this;

                this.addNew = function(e){
                    if(e.keyCode === 13){
                        todoList.addNew(self.newTodo);
                        self.newTodo = '';
                    }
                };
            },
            controllerAs: 'todoAddNewCtrl'
        };
    }]);
})();