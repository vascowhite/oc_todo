/**
 * Created by paul on 09/02/16.
 */
'use strict';
(function(){
    angular.module('todo', ['ngRoute'])
        .config(['$httpProvider', function($httpProvider){
            $httpProvider.defaults.headers.common.requesttoken = OC.requestToken;
    }])
        .config(['$routeProvider', function($routeProvider){
            $routeProvider.
            when('/File', {
                template: "<todo-list-file></todo-list-file>"
            }).
            when('/Alpha', {
                template: "<todo-list-alpha></todo-list-alpha>"
            }).
            when('/Priority', {
                template: "<todo-list-priority></todo-list-priority>"
            }).
            when('/Project', {
                template: "<todo-list-project></todo-list-project>"
            }).
            when('/Context', {
                template: "<todo-list-context></todo-list-context>"
            }).
            when('/DueDate', {
                template: "<todo-list-due-date></todo-list-due-date>"
            }).
            otherwise({
                redirectTo: '/File'
            });
        }])
        .run(['$route', function($route){
            /**
             * Work around for https://github.com/angular/angular.js/issues/1213
             * and https://github.com/angular/angular.js/issues/6812
             */
            $route.reload();
        }]);
})();
/**
 * Created by paul on 11/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    service('TodoOptions', ['$http', function TodoOptions($http){
        this.options;

        var self = this;

        this.getOptions = function(callback){
            $http.get(OC.generateUrl('apps/todo/options')).then(function(data){
                self.options = processData(data.data.data);
                callback(self.options);
            });
        };

        this.toggleOption = function(optionName){
            this.options[optionName] = !this.options[optionName];
            this.setOption(optionName, this.options[optionName]);
        };

        this.setOption = function(optionName, optionValue){
            $http.put(OC.generateUrl('apps/todo/options/' + optionName), {option: optionName, value: btoa(optionValue)}).
            then(function(data){
                self.options = processData(data.data);
            });
        };

        this.get = function(optionName){
            var optionValue;
            if(!this.options){
                this.getOptions(function(options){
                    optionValue = options[optionName];
                });
            } else {
                optionValue = this.options[optionName];
            }
            return optionValue;
        };

        var processData = function(data){
            var options = {};
            options.autoArchive = (data.autoArchive === 'true');
            options.hiliteOverdue = (data.hiliteOverdue === 'true');
            options.todoPath = data.todoPath;
            options.donePath = data.donePath;
            return options;
        };
    }]);
})();
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
            if(self.todolist !== undefined && self.todolist.length > 0){
                self.prepare();
                callback(self.todolist);
                return;
            }
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

        this.edit = function(todoNum, newText){
            $http.put(OC.generateUrl('apps/todo/update/' + todoNum), {todoNum: todoNum, newText: btoa(newText)}).
            then(function(data){
                var todo = data.data;
                todo.todoNum = todoNum;
                self.todolist[todoNum] = todo;
                self.prepare();
            });
        };

        this.getList(function(todos){
            self.todolist = todos;
            self.prepare();
        });
    }]);
})();
/**
 * Created by paul on 13/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoNavigation', ['$location', function todoNavigation($location){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.navigation'),
            controller: function(){
                this.sorters = [
                    'File', 'Alpha', 'Priority', 'Context', 'Project', 'Due Date'
                ];

                this.getUrl = function(sorter){
                    return '#/' + sorter.replace(/\s+/g, '');
                };

                this.setPath = function(path){
                    $location.path(path);
                };

                this.getClass = function(sorter){
                    return 'sortby sortby-' + sorter.toLowerCase().replace(/\s+/g, '');
                };

            },
            controllerAs: 'collectionCtrl'
        };
    }]);
})();
/**
 * Created by paul on 13/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoContent', ['TodoOptions', '$location', function todoContent(todoOptions, $location){
        return{
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.content'),
            scope: {},
            controller: function($scope){
                this.tdFilter = '';
                this.options = {};

                var self = this;

                this.location = $location;
                if(this.location.path() === '' || this.location.path() === '/'){
                    this.location.path('/#');
                }

                this.init = function(){
                    todoOptions.getOptions(function (options) {
                        self.options = options;
                    });
                }

                this.init();
            },
            controllerAs: 'todoCtrl'
        };
    }]);
})();
/**
 * Created by paul on 13/02/16.
 */
'use strict';
(function(){
    angular.module('todo').
    directive('todoSettings', ['$http', 'TodoOptions', function todoSettings($http, todoOptions){
        return {
            restrict: 'E',
            templateUrl: OC.generateUrl('apps/todo/template/part.settings'),
            scope: {},
            controller: function($scope){
                this. options = {};
                var self = this;

                todoOptions.getOptions(function(options){
                    self.options = options;
                    $scope.options = options;
                });

                this.toggleOption = function(optionName){
                    self.options[optionName] = !self.options[optionName];
                    todoOptions.setOption(optionName, self.options[optionName]);
                };

                this.setOption = function(optionName, optionValue){
                    self.options[optionName] = optionValue;
                    todoOptions.setOption(optionName, optionValue);
                }
            },
            controllerAs: 'settingsCtrl'
        };
    }]);
})();
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

                this.doTodo = function(todoNum){
                    todoList.doTodo(todoNum);
                };

                this.archive = function(todoNum){
                    todoList.archive(todoNum);
                };
            },
            controllerAs: 'todoItemCtrl'
        };
    }]);
})();
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
/**
 * Created by paul on 22/02/16.
 */
'use strict';
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
/**
 * Created by paul on 22/02/16.
 */
'use strict';
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
/**
 * Created by paul on 22/02/16.
 */
'use strict';
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
/**
 * Created by paul on 21/02/16.
 */
'use strict';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInRvZG9PcHRpb25zLmpzIiwidG9kb0xpc3QuanMiLCJ0b2RvbmF2aWdhdGlvbi5qcyIsInRvZG9Db250ZW50LmpzIiwidG9kb1NldHRpbmdzLmpzIiwidG9kb0l0ZW0uanMiLCJ0b2RvRWRpdEl0ZW0uanMiLCJ0b2RvTGlzdEZpbGUuanMiLCJ0b2RvTGlzdEFscGhhLmpzIiwidG9kb0xpc3RQcmlvcml0eS5qcyIsInRvZG9MaXN0UHJvamVjdC5qcyIsInRvZG9MaXN0Q29udGV4dC5qcyIsInRvZG9MaXN0RHVlRGF0ZS5qcyIsInRvZG9BZGROZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDA5LzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycsIFsnbmdSb3V0ZSddKVxuICAgICAgICAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpe1xuICAgICAgICAgICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5yZXF1ZXN0dG9rZW4gPSBPQy5yZXF1ZXN0VG9rZW47XG4gICAgfV0pXG4gICAgICAgIC5jb25maWcoWyckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKXtcbiAgICAgICAgICAgICRyb3V0ZVByb3ZpZGVyLlxuICAgICAgICAgICAgd2hlbignL0ZpbGUnLCB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1maWxlPjwvdG9kby1saXN0LWZpbGU+XCJcbiAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgd2hlbignL0FscGhhJywge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcIjx0b2RvLWxpc3QtYWxwaGE+PC90b2RvLWxpc3QtYWxwaGE+XCJcbiAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgd2hlbignL1ByaW9yaXR5Jywge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcIjx0b2RvLWxpc3QtcHJpb3JpdHk+PC90b2RvLWxpc3QtcHJpb3JpdHk+XCJcbiAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgd2hlbignL1Byb2plY3QnLCB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1wcm9qZWN0PjwvdG9kby1saXN0LXByb2plY3Q+XCJcbiAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgd2hlbignL0NvbnRleHQnLCB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1jb250ZXh0PjwvdG9kby1saXN0LWNvbnRleHQ+XCJcbiAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgd2hlbignL0R1ZURhdGUnLCB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1kdWUtZGF0ZT48L3RvZG8tbGlzdC1kdWUtZGF0ZT5cIlxuICAgICAgICAgICAgfSkuXG4gICAgICAgICAgICBvdGhlcndpc2Uoe1xuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICcvRmlsZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSlcbiAgICAgICAgLnJ1bihbJyRyb3V0ZScsIGZ1bmN0aW9uKCRyb3V0ZSl7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLmpzL2lzc3Vlcy8xMjEzXG4gICAgICAgICAgICAgKiBhbmQgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci5qcy9pc3N1ZXMvNjgxMlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAkcm91dGUucmVsb2FkKCk7XG4gICAgICAgIH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMTEvMDIvMTYuXG4gKi9cbid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbigpe1xuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXG4gICAgc2VydmljZSgnVG9kb09wdGlvbnMnLCBbJyRodHRwJywgZnVuY3Rpb24gVG9kb09wdGlvbnMoJGh0dHApe1xuICAgICAgICB0aGlzLm9wdGlvbnM7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICAgICAgICAgICRodHRwLmdldChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL29wdGlvbnMnKSkudGhlbihmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMgPSBwcm9jZXNzRGF0YShkYXRhLmRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soc2VsZi5vcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlT3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSl7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV0gPSAhdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdO1xuICAgICAgICAgICAgdGhpcy5zZXRPcHRpb24ob3B0aW9uTmFtZSwgdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUsIG9wdGlvblZhbHVlKXtcbiAgICAgICAgICAgICRodHRwLnB1dChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL29wdGlvbnMvJyArIG9wdGlvbk5hbWUpLCB7b3B0aW9uOiBvcHRpb25OYW1lLCB2YWx1ZTogYnRvYShvcHRpb25WYWx1ZSl9KS5cbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zID0gcHJvY2Vzc0RhdGEoZGF0YS5kYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24ob3B0aW9uTmFtZSl7XG4gICAgICAgICAgICB2YXIgb3B0aW9uVmFsdWU7XG4gICAgICAgICAgICBpZighdGhpcy5vcHRpb25zKXtcbiAgICAgICAgICAgICAgICB0aGlzLmdldE9wdGlvbnMoZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvblZhbHVlID0gb3B0aW9uc1tvcHRpb25OYW1lXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uVmFsdWUgPSB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uVmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByb2Nlc3NEYXRhID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5hdXRvQXJjaGl2ZSA9IChkYXRhLmF1dG9BcmNoaXZlID09PSAndHJ1ZScpO1xuICAgICAgICAgICAgb3B0aW9ucy5oaWxpdGVPdmVyZHVlID0gKGRhdGEuaGlsaXRlT3ZlcmR1ZSA9PT0gJ3RydWUnKTtcbiAgICAgICAgICAgIG9wdGlvbnMudG9kb1BhdGggPSBkYXRhLnRvZG9QYXRoO1xuICAgICAgICAgICAgb3B0aW9ucy5kb25lUGF0aCA9IGRhdGEuZG9uZVBhdGg7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICAgICAgfTtcbiAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDEzLzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxuICAgIHNlcnZpY2UoJ1RvZG9MaXN0JywgWyckaHR0cCcsICckaW50ZXJ2YWwnLCBmdW5jdGlvbiBUb2RvTGlzdCgkaHR0cCwgJGludGVydmFsKXtcbiAgICAgICAgdGhpcy50b2RvbGlzdCA9IFtdO1xuICAgICAgICB0aGlzLnRvZG9saXN0RmlsZSA9IFtdO1xuICAgICAgICB0aGlzLnRvZG9saXN0QWxwaGEgPSBbXTtcbiAgICAgICAgdGhpcy50b2RvbGlzdFByaW9yaXR5ID0gW107XG4gICAgICAgIHRoaXMudG9kb2xpc3RDb250ZXh0ID0ge307XG4gICAgICAgIHRoaXMudG9kb2xpc3RQcm9qZWN0ID0ge307XG4gICAgICAgIHRoaXMudG9kb2xpc3REdWVEYXRlID0gW107XG5cbiAgICAgICAgdmFyIHNvcnRPcmRlcnMgPSBbXG4gICAgICAgICAgICB7bmFtZTogJ0ZpbGUnLCBzb3J0RnVuYzogZnVuY3Rpb24odG9kb2xpc3Qpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2RvbGlzdDtcbiAgICAgICAgICAgIH19LFxuICAgICAgICAgICAge25hbWU6ICdBbHBoYScsIHNvcnRGdW5jOiBmdW5jdGlvbih0b2RvbGlzdCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvZG9saXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50ZXh0LmxvY2FsZUNvbXBhcmUoYi50ZXh0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH19LFxuICAgICAgICAgICAge25hbWU6ICdQcmlvcml0eScsIHNvcnRGdW5jOiBmdW5jdGlvbih0b2RvbGlzdCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvZG9saXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50b2RvLmxvY2FsZUNvbXBhcmUoYi50b2RvKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH19LFxuICAgICAgICAgICAge25hbWU6ICdDb250ZXh0Jywgc29ydEZ1bmM6IGZ1bmN0aW9uKHRvZG9saXN0KXtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dHMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gdG9kb2xpc3QubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBudW1Db250ZXh0cyA9IHRvZG9saXN0W2ldLmNvbnRleHRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IG51bUNvbnRleHRzOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHRvZG9saXN0W2ldLmNvbnRleHRzW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvZG8gPSB0b2RvbGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFjb250ZXh0cy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0c1twcm9wZXJ0eU5hbWVdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dHNbcHJvcGVydHlOYW1lXS5uYW1lID0gJ0AnICsgcHJvcGVydHlOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRzW3Byb3BlcnR5TmFtZV0udG9kb3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRzW3Byb3BlcnR5TmFtZV0udG9kb3MucHVzaCh0b2RvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dHM7XG4gICAgICAgICAgICB9fSxcbiAgICAgICAgICAgIHtuYW1lOiAnUHJvamVjdCcsIHNvcnRGdW5jOiBmdW5jdGlvbih0b2RvbGlzdCl7XG4gICAgICAgICAgICAgICAgdmFyIHByb2plY3RzID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRvZG9saXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbnVtUHJvamVjdHMgPSB0b2RvbGlzdFtpXS5wcm9qZWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCBudW1Qcm9qZWN0czsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSB0b2RvbGlzdFtpXS5wcm9qZWN0c1tqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b2RvID0gdG9kb2xpc3RbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighcHJvamVjdHMuaGFzT3duUHJvcGVydHkocHJvcGVydHlOYW1lKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHNbcHJvcGVydHlOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzW3Byb3BlcnR5TmFtZV0ubmFtZSA9ICcrJyArIHByb3BlcnR5TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0c1twcm9wZXJ0eU5hbWVdLnRvZG9zID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0c1twcm9wZXJ0eU5hbWVdLnRvZG9zLnB1c2godG9kbyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3RzO1xuICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICB7bmFtZTogJ0R1ZURhdGUnLCBzb3J0RnVuYzogZnVuY3Rpb24odG9kb2xpc3Qpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2RvbGlzdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoYS5kdWUgJiYgYi5kdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuZHVlLmxvY2FsZUNvbXBhcmUoYi5kdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKGEuZHVlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihiLmR1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50b2RvLmxvY2FsZUNvbXBhcmUoYi50b2RvKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH19XG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZ2V0TGlzdCA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICAgICAgICAgIGlmKHNlbGYudG9kb2xpc3QgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnRvZG9saXN0Lmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHNlbGYudG9kb2xpc3QpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRodHRwLmdldChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL2dldCcpKS5cbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgdmFyIHRvZG9MaXN0ID0gZGF0YS5kYXRhLmRhdGEudG9kb3M7XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRvZG9MaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpICsrKXtcbiAgICAgICAgICAgICAgICAgICAgdG9kb0xpc3RbaV0udG9kb051bSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYudG9kb2xpc3QgPSB0b2RvTGlzdDtcbiAgICAgICAgICAgICAgICBzZWxmLnByZXBhcmUoKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0b2RvTGlzdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnByZXBhcmUgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gc29ydE9yZGVycy5sZW5ndGg7IGkgPCBsZW47IGkgKysgKXtcbiAgICAgICAgICAgICAgICB2YXIgc29ydGVkID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnRvZG9saXN0KSk7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9ICd0b2RvbGlzdCcgKyBzb3J0T3JkZXJzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSBzb3J0T3JkZXJzW2ldLnNvcnRGdW5jKHNvcnRlZCk7XG4gICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXG5cbiAgICAgICAgdGhpcy5kb1RvZG8gPSBmdW5jdGlvbih0b2RvTnVtKXtcbiAgICAgICAgICAgIHZhciB1cmwgPSAnJztcbiAgICAgICAgICAgIGlmKCFzZWxmLnRvZG9saXN0W3RvZG9OdW1dLmNvbXBsZXRlZCl7XG4gICAgICAgICAgICAgICAgdXJsID0gT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby9kby8nICsgdG9kb051bSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihzZWxmLnRvZG9saXN0W3RvZG9OdW1dLmNvbXBsZXRlZCl7XG4gICAgICAgICAgICAgICAgdXJsID0gT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby91bmRvLycgKyB0b2RvTnVtKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGh0dHAucHV0KHVybCwge3RvZG9OdW06IHRvZG9OdW19KS5cbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgc2VsZi50b2RvbGlzdFt0b2RvTnVtXSA9IGRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICBzZWxmLnRvZG9saXN0W3RvZG9OdW1dLnRvZG9OdW0gPSB0b2RvTnVtO1xuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGROZXcgPSBmdW5jdGlvbihuZXdUb2RvKXtcbiAgICAgICAgICAgIGlmKG5ld1RvZG8gPT09ICcnKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkaHR0cC5wb3N0KE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vYWRkJyksIHt0b2RvVGV4dDogYnRvYShuZXdUb2RvKX0pLlxuICAgICAgICAgICAgdGhlbihmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SW5kZXggPSBzZWxmLnRvZG9saXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBzZWxmLnRvZG9saXN0LnB1c2goZGF0YS5kYXRhLmRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYudG9kb2xpc3RbbmV3SW5kZXhdLnRvZG9OdW0gPSBuZXdJbmRleDtcbiAgICAgICAgICAgICAgICBzZWxmLnByZXBhcmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXJjaGl2ZSA9IGZ1bmN0aW9uKHRvZG9OdW0pe1xuICAgICAgICAgICAgLy9SZW1vdmUgaXRlbSBmcm9tIGxpc3QgYWZ0ZXIgc2hvcnQgZGVsYXkuIFNheSAyIHNlY29uZHM/XG4gICAgICAgICAgICAvL1VzZSAkaW50ZXJ2YWw/XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQXJjaGl2aW5nIHRvZG8gbnVtYmVyICcgKyB0b2RvTnVtKTtcbiAgICAgICAgICAgICRodHRwLnBvc3QoT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby9hcmNoaXZlJyksIHt0b2RvTnVtOiB0b2RvTnVtfSkuXG4gICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIHZhciB0b2RvbGlzdCA9IGRhdGEuZGF0YS50b2RvcztcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gdG9kb2xpc3QubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkgKyspe1xuICAgICAgICAgICAgICAgICAgICB0b2RvbGlzdFtpXS50b2RvTnVtID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi50b2RvbGlzdCA9IHRvZG9saXN0O1xuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5lZGl0ID0gZnVuY3Rpb24odG9kb051bSwgbmV3VGV4dCl7XG4gICAgICAgICAgICAkaHR0cC5wdXQoT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby91cGRhdGUvJyArIHRvZG9OdW0pLCB7dG9kb051bTogdG9kb051bSwgbmV3VGV4dDogYnRvYShuZXdUZXh0KX0pLlxuICAgICAgICAgICAgdGhlbihmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICB2YXIgdG9kbyA9IGRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICB0b2RvLnRvZG9OdW0gPSB0b2RvTnVtO1xuICAgICAgICAgICAgICAgIHNlbGYudG9kb2xpc3RbdG9kb051bV0gPSB0b2RvO1xuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMaXN0KGZ1bmN0aW9uKHRvZG9zKXtcbiAgICAgICAgICAgIHNlbGYudG9kb2xpc3QgPSB0b2RvcztcbiAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xuICAgICAgICB9KTtcbiAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDEzLzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxuICAgIGRpcmVjdGl2ZSgndG9kb05hdmlnYXRpb24nLCBbJyRsb2NhdGlvbicsIGZ1bmN0aW9uIHRvZG9OYXZpZ2F0aW9uKCRsb2NhdGlvbil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC5uYXZpZ2F0aW9uJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRoaXMuc29ydGVycyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ0ZpbGUnLCAnQWxwaGEnLCAnUHJpb3JpdHknLCAnQ29udGV4dCcsICdQcm9qZWN0JywgJ0R1ZSBEYXRlJ1xuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmdldFVybCA9IGZ1bmN0aW9uKHNvcnRlcil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnIy8nICsgc29ydGVyLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFBhdGggPSBmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q2xhc3MgPSBmdW5jdGlvbihzb3J0ZXIpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NvcnRieSBzb3J0YnktJyArIHNvcnRlci50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICdjb2xsZWN0aW9uQ3RybCdcbiAgICAgICAgfTtcbiAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDEzLzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxuICAgIGRpcmVjdGl2ZSgndG9kb0NvbnRlbnQnLCBbJ1RvZG9PcHRpb25zJywgJyRsb2NhdGlvbicsIGZ1bmN0aW9uIHRvZG9Db250ZW50KHRvZG9PcHRpb25zLCAkbG9jYXRpb24pe1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC5jb250ZW50JyksXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudGRGaWx0ZXIgPSAnJztcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcblxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSAkbG9jYXRpb247XG4gICAgICAgICAgICAgICAgaWYodGhpcy5sb2NhdGlvbi5wYXRoKCkgPT09ICcnIHx8IHRoaXMubG9jYXRpb24ucGF0aCgpID09PSAnLycpe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2F0aW9uLnBhdGgoJy8jJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgdG9kb09wdGlvbnMuZ2V0T3B0aW9ucyhmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndG9kb0N0cmwnXG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAxMy8wMi8xNi5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uKCl7XG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cbiAgICBkaXJlY3RpdmUoJ3RvZG9TZXR0aW5ncycsIFsnJGh0dHAnLCAnVG9kb09wdGlvbnMnLCBmdW5jdGlvbiB0b2RvU2V0dGluZ3MoJGh0dHAsIHRvZG9PcHRpb25zKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LnNldHRpbmdzJyksXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUpe1xuICAgICAgICAgICAgICAgIHRoaXMuIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICB0b2RvT3B0aW9ucy5nZXRPcHRpb25zKGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZU9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnNbb3B0aW9uTmFtZV0gPSAhc2VsZi5vcHRpb25zW29wdGlvbk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICB0b2RvT3B0aW9ucy5zZXRPcHRpb24ob3B0aW9uTmFtZSwgc2VsZi5vcHRpb25zW29wdGlvbk5hbWVdKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lLCBvcHRpb25WYWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvblZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0b2RvT3B0aW9ucy5zZXRPcHRpb24ob3B0aW9uTmFtZSwgb3B0aW9uVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICdzZXR0aW5nc0N0cmwnXG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAyMS8wMi8xNi5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uKCl7XG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cbiAgICBkaXJlY3RpdmUoJ3RvZG9JdGVtJywgWydUb2RvTGlzdCcsIGZ1bmN0aW9uIHRvZG9JdGVtKHRvZG9MaXN0KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LnRvZG9saXN0SXRlbScpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgIHRoaXMuZG9Ub2RvID0gZnVuY3Rpb24odG9kb051bSl7XG4gICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0LmRvVG9kbyh0b2RvTnVtKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcmNoaXZlID0gZnVuY3Rpb24odG9kb051bSl7XG4gICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0LmFyY2hpdmUodG9kb051bSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd0b2RvSXRlbUN0cmwnXG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAyMS8wMi8xNi5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uKCl7XG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cbiAgICBkaXJlY3RpdmUoJ3RvZG9FZGl0SXRlbScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvRWRpdEl0ZW0odG9kb0xpc3Qpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb0VkaXRJdGVtJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRoaXMubmV3VGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0VkaXQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdCA9IGZ1bmN0aW9uKGUsIHRvZG9OdW0pe1xuICAgICAgICAgICAgICAgICAgICBpZihlLmtleUNvZGUgPT09IDEzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0LmVkaXQodG9kb051bSwgc2VsZi5uZXdUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndG9kb0VkaXRDdHJsJ1xuICAgICAgICB9O1xuICAgIH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMjIvMDIvMTYuXG4gKi9cbid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbigpe1xuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXG4gICAgZGlyZWN0aXZlKCd0b2RvTGlzdEZpbGUnLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0xpc3RGaWxlKHRvZG9MaXN0KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LnRvZG9saXN0RmlsZScpLFxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XG4gICAgICAgICAgICAgICAgc2NvcGUudG9kb0xpc3QgPSB0b2RvTGlzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxuICAgIGRpcmVjdGl2ZSgndG9kb0xpc3RBbHBoYScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdEFscGhhKHRvZG9MaXN0KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LnRvZG9saXN0QWxwaGEnKSxcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpe1xuICAgICAgICAgICAgICAgIHNjb3BlLnRvZG9MaXN0ID0gdG9kb0xpc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAyMi8wMi8xNi5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uKCl7XG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0UHJpb3JpdHknLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0xpc3RQcmlvcml0eSh0b2RvTGlzdCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC50b2RvbGlzdFByaW9yaXR5JyksXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKXtcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMjIvMDIvMTYuXG4gKi9cbid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbigpe1xuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXG4gICAgZGlyZWN0aXZlKCd0b2RvTGlzdFByb2plY3QnLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0xpc3RQcm9qZWN0KHRvZG9MaXN0KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LnRvZG9saXN0UHJvamVjdCcpLFxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XG4gICAgICAgICAgICAgICAgc2NvcGUudG9kb0xpc3QgPSB0b2RvTGlzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxuICovXG4ndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24oKXtcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxuICAgIGRpcmVjdGl2ZSgndG9kb0xpc3RDb250ZXh0JywgWydUb2RvTGlzdCcsIGZ1bmN0aW9uIHRvZG9MaXN0Q29udGV4dCh0b2RvTGlzdCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC50b2RvbGlzdENvbnRleHQnKSxcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpe1xuICAgICAgICAgICAgICAgIHNjb3BlLnRvZG9MaXN0ID0gdG9kb0xpc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAyMi8wMi8xNi5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uKCl7XG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0RHVlRGF0ZScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdER1ZURhdGUodG9kb0xpc3Qpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3REdWVEYXRlJyksXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKXtcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMjEvMDIvMTYuXG4gKi9cbid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbigpe1xuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXG4gICAgZGlyZWN0aXZlKCd0b2RvQWRkTmV3JywgWydUb2RvTGlzdCcsIGZ1bmN0aW9uIHRvZG9BZGROZXcodG9kb0xpc3Qpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb0FkZE5ldycpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGlzLm5ld1RvZG8gPSAnJztcblxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3ID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9kb0xpc3QuYWRkTmV3KHNlbGYubmV3VG9kbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld1RvZG8gPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndG9kb0FkZE5ld0N0cmwnXG4gICAgICAgIH07XG4gICAgfV0pO1xufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
