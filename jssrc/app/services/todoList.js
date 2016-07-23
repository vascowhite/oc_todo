/**
 * Created by paul on 13/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    service('TodoList', ['$http', '$interval', function TodoList($http, $interval){
        this.todolist = [];
        this.todolistFile = [];
        this.todolistAlpha = [];
        this.todolistPriority = [];
        this.todolistContext = {};
        this.todolistProject = {};
        this.todolistDueDate = [];

        var sortOrders = [
            {name: 'File', sortFunc: function(todolist){
                return todolist;
            }},
            {name: 'Alpha', sortFunc: function(todolist){
                return todolist.sort(function(a, b) {
                    return a.text.localeCompare(b.text);
                });
            }},
            {name: 'Priority', sortFunc: function(todolist){
                return todolist.sort(function(a, b) {
                    return a.todo.localeCompare(b.todo);
                });
            }},
            {name: 'Context', sortFunc: function(todolist){
                var contexts = {};
                var len = todolist.length;
                for(var i = 0; i < len; i++){
                    var numContexts = todolist[i].contexts.length;
                    for(var j = 0; j < numContexts; j++){
                        var propertyName = todolist[i].contexts[j];
                        var todo = todolist[i];
                        if(!contexts.hasOwnProperty(propertyName)){
                            contexts[propertyName] = {};
                            contexts[propertyName].name = '@' + propertyName;
                            contexts[propertyName].todos = [];
                        }
                        contexts[propertyName].todos.push(todo);
                    }
                }
                return contexts;
            }},
            {name: 'Project', sortFunc: function(todolist){
                var projects = {};
                var len = todolist.length;
                for(var i = 0; i < len; i++){
                    var numProjects = todolist[i].projects.length;
                    for(var j = 0; j < numProjects; j++){
                        var propertyName = todolist[i].projects[j];
                        var todo = todolist[i];
                        if(!projects.hasOwnProperty(propertyName)){
                            projects[propertyName] = {};
                            projects[propertyName].name = '+' + propertyName;
                            projects[propertyName].todos = [];
                        }
                        projects[propertyName].todos.push(todo);
                    }
                }
                return projects;
            }},
            {name: 'DueDate', sortFunc: function(todolist){
                return todolist.sort(function(a, b) {
                    if(a.due && b.due){
                        return a.due.localeCompare(b.due);
                    }
                    if(a.due){
                        return -1;
                    }
                    if(b.due){
                        return 1;
                    }
                    return a.todo.localeCompare(b.todo);
                });
            }}
        ];

        var self = this;

        this.getList = function(callback){
            $http.get(OC.generateUrl('apps/todo/get')).
            then(function(data){
                var todoList = data.data.data.todos;
                var len = todoList.length;
                for(var i = 0; i < len; i ++){
                    todoList[i].todoNum = i;
                }
                self.todolist = todoList;
                self.prepare();
                callback(todoList);
            });
        };

        this.prepare = function(){
            for(var i = 0, len = sortOrders.length; i < len; i ++ ){
                var sorted = JSON.parse(JSON.stringify(this.todolist));
                var propertyName = 'todolist' + sortOrders[i].name;
                var propertyValue = sortOrders[i].sortFunc(sorted);
                this[propertyName] = propertyValue;
            }
        };



        this.doTodo = function(todoNum){
            var url = '';
            if(!self.todolist[todoNum].completed){
                url = OC.generateUrl('apps/todo/do/' + todoNum);
            }
            if(self.todolist[todoNum].completed){
                url = OC.generateUrl('apps/todo/undo/' + todoNum)
            }
            $http.put(url, {todoNum: todoNum}).
            then(function(data){
                self.todolist[todoNum] = data.data;
                self.todolist[todoNum].todoNum = todoNum;
                self.prepare();
            });
        };

        this.addNew = function(newTodo){
            if(newTodo === ''){
                return;
            }
            $http.post(OC.generateUrl('apps/todo/add'), {todoText: btoa(newTodo)}).
            then(function(data){
                var newIndex = self.todolist.length;
                self.todolist.push(data.data.data);
                self.todolist[newIndex].todoNum = newIndex;
                self.prepare();
            });
        };

        this.archive = function(todoNum){
            //Remove item from list after short delay. Say 2 seconds?
            //Use $interval?
            console.log('Archiving todo number ' + todoNum);
            $http.post(OC.generateUrl('apps/todo/archive'), {todoNum: todoNum}).
            then(function(data){
                var todolist = data.data.todos;
                var len = todolist.length;
                for(var i = 0; i < len; i ++){
                    todolist[i].todoNum = i;
                }
                self.todolist = todolist;
                self.prepare();
            });
        };

        this.delete = function(todoNum){
            //Remove item from list after short delay. Say 2 seconds?
            //Use $interval?
            console.log('Deleting todo number ' + todoNum);
            $http.post(OC.generateUrl('apps/todo/delete'), {todoNum: todoNum}).
            then(function(data){
                var todolist = data.data.todos;
                var len = todolist.length;
                for(var i = 0; i < len; i ++){
                    todolist[i].todoNum = i;
                }
                self.todolist = todolist;
                self.prepare();
            });
        };

        this.edit = function(todoNum, newText){
            $http.put(OC.generateUrl('apps/todo/update/' + todoNum), {todoNum: todoNum, newText: btoa(newText)}).
            then(function(data){
                var todo = data.data;
                todo.todoNum = todoNum;
                self.todolist[todoNum] = todo;
                self.prepare();
            });
        };

        self.getList(function(todos){
            self.todolist = todos;
            self.prepare();
        });

        $interval(function(){
            self.getList(function(todos){
                self.todolist = todos;
                self.prepare();
            });
        }, 30000);
    }]);
})();