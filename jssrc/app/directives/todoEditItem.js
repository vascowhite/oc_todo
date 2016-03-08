/**
 * Created by paul on 21/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoEditItem', ['TodoList', function todoEditItem(todoList){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.todoEditItem'),
            controller: function(){
                this.newText = '';
                this.showEdit = false;

                var self = this;

                this.edit = function(e, todoNum){
                    if(e.keyCode === 13){
                        todoList.edit(todoNum, self.newText);
                    }
                };
            },
            controllerAs: 'todoEditCtrl'
        };
    }]);
})();