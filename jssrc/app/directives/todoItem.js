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
                var todolist = todoList.todolist;
                var priorities = ['A', 'B', 'C', null];

                this.doTodo = function(todoNum){
                    todoList.doTodo(todoNum);
                };

                this.archive = function(todoNum){
                    todoList.archive(todoNum);
                };

                this.delete = function(todoNum){
                    todoList.delete(todoNum);
                };

                this.getTodoText = function(todoNum){
                    if(todolist[todoNum].priority !== null && todolist[todoNum].priority !== '' && todolist[todoNum].todo.substr(0, 1) === '('){
                        return todolist[todoNum].todo.substr(3);
                    }
                    if(todolist[todoNum].priority === null && todolist[todoNum].todo.substr(0, 1) === '('){
                        return todolist[todoNum].todo.substr(3);
                    }
                    return todolist[todoNum].todo;
                };

                this.getPriorityText = function(todoNum){
                    if(todolist[todoNum].priority === null || todolist[todoNum].priority === ''){
                        return '';
                    }
                    return '(' + todolist[todoNum].priority + ')';
                };

                this.changePriority = function(todoNum){
                    if(todolist[todoNum].completed){
                        return;
                    }
                    var currentPriority = todolist[todoNum].priority;
                    var currentIndex = priorities.indexOf(currentPriority);
                    var newIndex = (++ currentIndex % 4);
                    var newPriority = priorities[newIndex];
                    todolist[todoNum].priority = newPriority;
                    var newTodoText = this.getPriorityText(todoNum) + ' ' + this.getTodoText(todoNum);
                    todoList.edit(todoNum, newTodoText);
                }
            },
            controllerAs: 'todoItemCtrl'
        };
    }]);
})();