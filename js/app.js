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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInRvZG9PcHRpb25zLmpzIiwidG9kb0xpc3QuanMiLCJ0b2RvbmF2aWdhdGlvbi5qcyIsInRvZG9Db250ZW50LmpzIiwidG9kb1NldHRpbmdzLmpzIiwidG9kb0l0ZW0uanMiLCJ0b2RvRWRpdEl0ZW0uanMiLCJ0b2RvTGlzdEZpbGUuanMiLCJ0b2RvTGlzdEFscGhhLmpzIiwidG9kb0xpc3RQcmlvcml0eS5qcyIsInRvZG9MaXN0UHJvamVjdC5qcyIsInRvZG9MaXN0Q29udGV4dC5qcyIsInRvZG9MaXN0RHVlRGF0ZS5qcyIsInRvZG9BZGROZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMDkvMDIvMTYuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbihmdW5jdGlvbigpe1xyXG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nLCBbJ25nUm91dGUnXSlcclxuICAgICAgICAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpe1xyXG4gICAgICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnJlcXVlc3R0b2tlbiA9IE9DLnJlcXVlc3RUb2tlbjtcclxuICAgIH1dKVxyXG4gICAgICAgIC5jb25maWcoWyckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKXtcclxuICAgICAgICAgICAgJHJvdXRlUHJvdmlkZXIuXHJcbiAgICAgICAgICAgIHdoZW4oJy9GaWxlJywge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1maWxlPjwvdG9kby1saXN0LWZpbGU+XCJcclxuICAgICAgICAgICAgfSkuXHJcbiAgICAgICAgICAgIHdoZW4oJy9BbHBoYScsIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcIjx0b2RvLWxpc3QtYWxwaGE+PC90b2RvLWxpc3QtYWxwaGE+XCJcclxuICAgICAgICAgICAgfSkuXHJcbiAgICAgICAgICAgIHdoZW4oJy9Qcmlvcml0eScsIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcIjx0b2RvLWxpc3QtcHJpb3JpdHk+PC90b2RvLWxpc3QtcHJpb3JpdHk+XCJcclxuICAgICAgICAgICAgfSkuXHJcbiAgICAgICAgICAgIHdoZW4oJy9Qcm9qZWN0Jywge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1wcm9qZWN0PjwvdG9kby1saXN0LXByb2plY3Q+XCJcclxuICAgICAgICAgICAgfSkuXHJcbiAgICAgICAgICAgIHdoZW4oJy9Db250ZXh0Jywge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1jb250ZXh0PjwvdG9kby1saXN0LWNvbnRleHQ+XCJcclxuICAgICAgICAgICAgfSkuXHJcbiAgICAgICAgICAgIHdoZW4oJy9EdWVEYXRlJywge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFwiPHRvZG8tbGlzdC1kdWUtZGF0ZT48L3RvZG8tbGlzdC1kdWUtZGF0ZT5cIlxyXG4gICAgICAgICAgICB9KS5cclxuICAgICAgICAgICAgb3RoZXJ3aXNlKHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICcvRmlsZSdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfV0pXHJcbiAgICAgICAgLnJ1bihbJyRyb3V0ZScsIGZ1bmN0aW9uKCRyb3V0ZSl7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBXb3JrIGFyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci5qcy9pc3N1ZXMvMTIxM1xyXG4gICAgICAgICAgICAgKiBhbmQgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci5qcy9pc3N1ZXMvNjgxMlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgJHJvdXRlLnJlbG9hZCgpO1xyXG4gICAgICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDExLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBzZXJ2aWNlKCdUb2RvT3B0aW9ucycsIFsnJGh0dHAnLCBmdW5jdGlvbiBUb2RvT3B0aW9ucygkaHR0cCl7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zO1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgICAgICAgICAgJGh0dHAuZ2V0KE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vb3B0aW9ucycpKS50aGVuKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zID0gcHJvY2Vzc0RhdGEoZGF0YS5kYXRhLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soc2VsZi5vcHRpb25zKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdID0gIXRoaXMub3B0aW9uc1tvcHRpb25OYW1lXTtcclxuICAgICAgICAgICAgdGhpcy5zZXRPcHRpb24ob3B0aW9uTmFtZSwgdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUsIG9wdGlvblZhbHVlKXtcclxuICAgICAgICAgICAgJGh0dHAucHV0KE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vb3B0aW9ucy8nICsgb3B0aW9uTmFtZSksIHtvcHRpb246IG9wdGlvbk5hbWUsIHZhbHVlOiBidG9hKG9wdGlvblZhbHVlKX0pLlxyXG4gICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zID0gcHJvY2Vzc0RhdGEoZGF0YS5kYXRhKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXQgPSBmdW5jdGlvbihvcHRpb25OYW1lKXtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblZhbHVlO1xyXG4gICAgICAgICAgICBpZighdGhpcy5vcHRpb25zKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0T3B0aW9ucyhmdW5jdGlvbihvcHRpb25zKXtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25WYWx1ZSA9IG9wdGlvbnNbb3B0aW9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvblZhbHVlID0gdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25WYWx1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcHJvY2Vzc0RhdGEgPSBmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7fTtcclxuICAgICAgICAgICAgb3B0aW9ucy5hdXRvQXJjaGl2ZSA9IChkYXRhLmF1dG9BcmNoaXZlID09PSAndHJ1ZScpO1xyXG4gICAgICAgICAgICBvcHRpb25zLmhpbGl0ZU92ZXJkdWUgPSAoZGF0YS5oaWxpdGVPdmVyZHVlID09PSAndHJ1ZScpO1xyXG4gICAgICAgICAgICBvcHRpb25zLnRvZG9QYXRoID0gZGF0YS50b2RvUGF0aDtcclxuICAgICAgICAgICAgb3B0aW9ucy5kb25lUGF0aCA9IGRhdGEuZG9uZVBhdGg7XHJcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7XHJcbn0pKCk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAxMy8wMi8xNi5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuKGZ1bmN0aW9uKCl7XHJcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxyXG4gICAgc2VydmljZSgnVG9kb0xpc3QnLCBbJyRodHRwJywgJyRpbnRlcnZhbCcsIGZ1bmN0aW9uIFRvZG9MaXN0KCRodHRwLCAkaW50ZXJ2YWwpe1xyXG4gICAgICAgIHRoaXMudG9kb2xpc3QgPSBbXTtcclxuICAgICAgICB0aGlzLnRvZG9saXN0RmlsZSA9IFtdO1xyXG4gICAgICAgIHRoaXMudG9kb2xpc3RBbHBoYSA9IFtdO1xyXG4gICAgICAgIHRoaXMudG9kb2xpc3RQcmlvcml0eSA9IFtdO1xyXG4gICAgICAgIHRoaXMudG9kb2xpc3RDb250ZXh0ID0ge307XHJcbiAgICAgICAgdGhpcy50b2RvbGlzdFByb2plY3QgPSB7fTtcclxuICAgICAgICB0aGlzLnRvZG9saXN0RHVlRGF0ZSA9IFtdO1xyXG5cclxuICAgICAgICB2YXIgc29ydE9yZGVycyA9IFtcclxuICAgICAgICAgICAge25hbWU6ICdGaWxlJywgc29ydEZ1bmM6IGZ1bmN0aW9uKHRvZG9saXN0KXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0b2RvbGlzdDtcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtuYW1lOiAnQWxwaGEnLCBzb3J0RnVuYzogZnVuY3Rpb24odG9kb2xpc3Qpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvZG9saXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLnRleHQubG9jYWxlQ29tcGFyZShiLnRleHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7bmFtZTogJ1ByaW9yaXR5Jywgc29ydEZ1bmM6IGZ1bmN0aW9uKHRvZG9saXN0KXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0b2RvbGlzdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50b2RvLmxvY2FsZUNvbXBhcmUoYi50b2RvKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge25hbWU6ICdDb250ZXh0Jywgc29ydEZ1bmM6IGZ1bmN0aW9uKHRvZG9saXN0KXtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0cyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRvZG9saXN0Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG51bUNvbnRleHRzID0gdG9kb2xpc3RbaV0uY29udGV4dHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCBudW1Db250ZXh0czsgaisrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHRvZG9saXN0W2ldLmNvbnRleHRzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG9kbyA9IHRvZG9saXN0W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighY29udGV4dHMuaGFzT3duUHJvcGVydHkocHJvcGVydHlOYW1lKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0c1twcm9wZXJ0eU5hbWVdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0c1twcm9wZXJ0eU5hbWVdLm5hbWUgPSAnQCcgKyBwcm9wZXJ0eU5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0c1twcm9wZXJ0eU5hbWVdLnRvZG9zID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dHNbcHJvcGVydHlOYW1lXS50b2Rvcy5wdXNoKHRvZG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0cztcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtuYW1lOiAnUHJvamVjdCcsIHNvcnRGdW5jOiBmdW5jdGlvbih0b2RvbGlzdCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvamVjdHMgPSB7fTtcclxuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0b2RvbGlzdC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBudW1Qcm9qZWN0cyA9IHRvZG9saXN0W2ldLnByb2plY3RzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgbnVtUHJvamVjdHM7IGorKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSB0b2RvbGlzdFtpXS5wcm9qZWN0c1tqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvZG8gPSB0b2RvbGlzdFtpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIXByb2plY3RzLmhhc093blByb3BlcnR5KHByb3BlcnR5TmFtZSkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHNbcHJvcGVydHlOYW1lXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHNbcHJvcGVydHlOYW1lXS5uYW1lID0gJysnICsgcHJvcGVydHlOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHNbcHJvcGVydHlOYW1lXS50b2RvcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzW3Byb3BlcnR5TmFtZV0udG9kb3MucHVzaCh0b2RvKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdHM7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7bmFtZTogJ0R1ZURhdGUnLCBzb3J0RnVuYzogZnVuY3Rpb24odG9kb2xpc3Qpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvZG9saXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGEuZHVlICYmIGIuZHVlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuZHVlLmxvY2FsZUNvbXBhcmUoYi5kdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZihhLmR1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYi5kdWUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEudG9kby5sb2NhbGVDb21wYXJlKGIudG9kbyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0TGlzdCA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgICAgICAgICAgaWYoc2VsZi50b2RvbGlzdCAhPT0gdW5kZWZpbmVkICYmIHNlbGYudG9kb2xpc3QubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByZXBhcmUoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHNlbGYudG9kb2xpc3QpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRodHRwLmdldChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL2dldCcpKS5cclxuICAgICAgICAgICAgdGhlbihmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICAgICAgICAgIHZhciB0b2RvTGlzdCA9IGRhdGEuZGF0YS5kYXRhLnRvZG9zO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRvZG9MaXN0Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkgKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0W2ldLnRvZG9OdW0gPSBpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2VsZi50b2RvbGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICAgICAgc2VsZi5wcmVwYXJlKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0b2RvTGlzdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHJlcGFyZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHNvcnRPcmRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpICsrICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgc29ydGVkID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnRvZG9saXN0KSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gJ3RvZG9saXN0JyArIHNvcnRPcmRlcnNbaV0ubmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlID0gc29ydE9yZGVyc1tpXS5zb3J0RnVuYyhzb3J0ZWQpO1xyXG4gICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5kb1RvZG8gPSBmdW5jdGlvbih0b2RvTnVtKXtcclxuICAgICAgICAgICAgdmFyIHVybCA9ICcnO1xyXG4gICAgICAgICAgICBpZighc2VsZi50b2RvbGlzdFt0b2RvTnVtXS5jb21wbGV0ZWQpe1xyXG4gICAgICAgICAgICAgICAgdXJsID0gT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby9kby8nICsgdG9kb051bSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoc2VsZi50b2RvbGlzdFt0b2RvTnVtXS5jb21wbGV0ZWQpe1xyXG4gICAgICAgICAgICAgICAgdXJsID0gT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby91bmRvLycgKyB0b2RvTnVtKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRodHRwLnB1dCh1cmwsIHt0b2RvTnVtOiB0b2RvTnVtfSkuXHJcbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRvZG9saXN0W3RvZG9OdW1dID0gZGF0YS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50b2RvbGlzdFt0b2RvTnVtXS50b2RvTnVtID0gdG9kb051bTtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmFkZE5ldyA9IGZ1bmN0aW9uKG5ld1RvZG8pe1xyXG4gICAgICAgICAgICBpZihuZXdUb2RvID09PSAnJyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGh0dHAucG9zdChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL2FkZCcpLCB7dG9kb1RleHQ6IGJ0b2EobmV3VG9kbyl9KS5cclxuICAgICAgICAgICAgdGhlbihmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdJbmRleCA9IHNlbGYudG9kb2xpc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50b2RvbGlzdC5wdXNoKGRhdGEuZGF0YS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHNlbGYudG9kb2xpc3RbbmV3SW5kZXhdLnRvZG9OdW0gPSBuZXdJbmRleDtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmFyY2hpdmUgPSBmdW5jdGlvbih0b2RvTnVtKXtcclxuICAgICAgICAgICAgLy9SZW1vdmUgaXRlbSBmcm9tIGxpc3QgYWZ0ZXIgc2hvcnQgZGVsYXkuIFNheSAyIHNlY29uZHM/XHJcbiAgICAgICAgICAgIC8vVXNlICRpbnRlcnZhbD9cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FyY2hpdmluZyB0b2RvIG51bWJlciAnICsgdG9kb051bSk7XHJcbiAgICAgICAgICAgICRodHRwLnBvc3QoT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby9hcmNoaXZlJyksIHt0b2RvTnVtOiB0b2RvTnVtfSkuXHJcbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdG9kb2xpc3QgPSBkYXRhLmRhdGEudG9kb3M7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gdG9kb2xpc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbjsgaSArKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9kb2xpc3RbaV0udG9kb051bSA9IGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRvZG9saXN0ID0gdG9kb2xpc3Q7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByZXBhcmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0ID0gZnVuY3Rpb24odG9kb051bSwgbmV3VGV4dCl7XHJcbiAgICAgICAgICAgICRodHRwLnB1dChPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3VwZGF0ZS8nICsgdG9kb051bSksIHt0b2RvTnVtOiB0b2RvTnVtLCBuZXdUZXh0OiBidG9hKG5ld1RleHQpfSkuXHJcbiAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdG9kbyA9IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgIHRvZG8udG9kb051bSA9IHRvZG9OdW07XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRvZG9saXN0W3RvZG9OdW1dID0gdG9kbztcclxuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldExpc3QoZnVuY3Rpb24odG9kb3Mpe1xyXG4gICAgICAgICAgICBzZWxmLnRvZG9saXN0ID0gdG9kb3M7XHJcbiAgICAgICAgICAgIHNlbGYucHJlcGFyZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfV0pO1xyXG59KSgpOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMTMvMDIvMTYuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbihmdW5jdGlvbigpe1xyXG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cclxuICAgIGRpcmVjdGl2ZSgndG9kb05hdmlnYXRpb24nLCBbJyRsb2NhdGlvbicsIGZ1bmN0aW9uIHRvZG9OYXZpZ2F0aW9uKCRsb2NhdGlvbil7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC5uYXZpZ2F0aW9uJyksXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvcnRlcnMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0ZpbGUnLCAnQWxwaGEnLCAnUHJpb3JpdHknLCAnQ29udGV4dCcsICdQcm9qZWN0JywgJ0R1ZSBEYXRlJ1xyXG4gICAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldFVybCA9IGZ1bmN0aW9uKHNvcnRlcil7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcjLycgKyBzb3J0ZXIucmVwbGFjZSgvXFxzKy9nLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0UGF0aCA9IGZ1bmN0aW9uKHBhdGgpe1xyXG4gICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldENsYXNzID0gZnVuY3Rpb24oc29ydGVyKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NvcnRieSBzb3J0YnktJyArIHNvcnRlci50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJycpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2NvbGxlY3Rpb25DdHJsJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7XHJcbn0pKCk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgcGF1bCBvbiAxMy8wMi8xNi5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuKGZ1bmN0aW9uKCl7XHJcbiAgICBhbmd1bGFyLm1vZHVsZSgndG9kbycpLlxyXG4gICAgZGlyZWN0aXZlKCd0b2RvQ29udGVudCcsIFsnVG9kb09wdGlvbnMnLCAnJGxvY2F0aW9uJywgZnVuY3Rpb24gdG9kb0NvbnRlbnQodG9kb09wdGlvbnMsICRsb2NhdGlvbil7XHJcbiAgICAgICAgcmV0dXJue1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogT0MuZ2VuZXJhdGVVcmwoJ2FwcHMvdG9kby90ZW1wbGF0ZS9wYXJ0LmNvbnRlbnQnKSxcclxuICAgICAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy50ZEZpbHRlciA9ICcnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0ge307XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSAkbG9jYXRpb247XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmxvY2F0aW9uLnBhdGgoKSA9PT0gJycgfHwgdGhpcy5sb2NhdGlvbi5wYXRoKCkgPT09ICcvJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2NhdGlvbi5wYXRoKCcvIycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9kb09wdGlvbnMuZ2V0T3B0aW9ucyhmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd0b2RvQ3RybCdcclxuICAgICAgICB9O1xyXG4gICAgfV0pO1xyXG59KSgpOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMTMvMDIvMTYuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbihmdW5jdGlvbigpe1xyXG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cclxuICAgIGRpcmVjdGl2ZSgndG9kb1NldHRpbmdzJywgWyckaHR0cCcsICdUb2RvT3B0aW9ucycsIGZ1bmN0aW9uIHRvZG9TZXR0aW5ncygkaHR0cCwgdG9kb09wdGlvbnMpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQuc2V0dGluZ3MnKSxcclxuICAgICAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy4gb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIHRvZG9PcHRpb25zLmdldE9wdGlvbnMoZnVuY3Rpb24ob3B0aW9ucyl7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZU9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3B0aW9uc1tvcHRpb25OYW1lXSA9ICFzZWxmLm9wdGlvbnNbb3B0aW9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgdG9kb09wdGlvbnMuc2V0T3B0aW9uKG9wdGlvbk5hbWUsIHNlbGYub3B0aW9uc1tvcHRpb25OYW1lXSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0T3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSwgb3B0aW9uVmFsdWUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvblZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvZG9PcHRpb25zLnNldE9wdGlvbihvcHRpb25OYW1lLCBvcHRpb25WYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3NldHRpbmdzQ3RybCdcclxuICAgICAgICB9O1xyXG4gICAgfV0pO1xyXG59KSgpOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHBhdWwgb24gMjEvMDIvMTYuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbihmdW5jdGlvbigpe1xyXG4gICAgYW5ndWxhci5tb2R1bGUoJ3RvZG8nKS5cclxuICAgIGRpcmVjdGl2ZSgndG9kb0l0ZW0nLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0l0ZW0odG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3RJdGVtJyksXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5kb1RvZG8gPSBmdW5jdGlvbih0b2RvTnVtKXtcclxuICAgICAgICAgICAgICAgICAgICB0b2RvTGlzdC5kb1RvZG8odG9kb051bSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuYXJjaGl2ZSA9IGZ1bmN0aW9uKHRvZG9OdW0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0LmFyY2hpdmUodG9kb051bSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd0b2RvSXRlbUN0cmwnXHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIxLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9FZGl0SXRlbScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvRWRpdEl0ZW0odG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb0VkaXRJdGVtJyksXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld1RleHQgPSAnJztcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0VkaXQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0ID0gZnVuY3Rpb24oZSwgdG9kb051bSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZS5rZXlDb2RlID09PSAxMyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZG9MaXN0LmVkaXQodG9kb051bSwgc2VsZi5uZXdUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd0b2RvRWRpdEN0cmwnXHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0RmlsZScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdEZpbGUodG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3RGaWxlJyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0QWxwaGEnLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0xpc3RBbHBoYSh0b2RvTGlzdCl7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC50b2RvbGlzdEFscGhhJyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0UHJpb3JpdHknLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0xpc3RQcmlvcml0eSh0b2RvTGlzdCl7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC50b2RvbGlzdFByaW9yaXR5JyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0UHJvamVjdCcsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdFByb2plY3QodG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3RQcm9qZWN0JyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0Q29udGV4dCcsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdENvbnRleHQodG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3RDb250ZXh0JyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIyLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9MaXN0RHVlRGF0ZScsIFsnVG9kb0xpc3QnLCBmdW5jdGlvbiB0b2RvTGlzdER1ZURhdGUodG9kb0xpc3Qpe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBPQy5nZW5lcmF0ZVVybCgnYXBwcy90b2RvL3RlbXBsYXRlL3BhcnQudG9kb2xpc3REdWVEYXRlJyksXHJcbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS50b2RvTGlzdCA9IHRvZG9MaXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTtcclxufSkoKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBwYXVsIG9uIDIxLzAyLzE2LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG4oZnVuY3Rpb24oKXtcclxuICAgIGFuZ3VsYXIubW9kdWxlKCd0b2RvJykuXHJcbiAgICBkaXJlY3RpdmUoJ3RvZG9BZGROZXcnLCBbJ1RvZG9MaXN0JywgZnVuY3Rpb24gdG9kb0FkZE5ldyh0b2RvTGlzdCl7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IE9DLmdlbmVyYXRlVXJsKCdhcHBzL3RvZG8vdGVtcGxhdGUvcGFydC50b2RvQWRkTmV3JyksXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld1RvZG8gPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGROZXcgPSBmdW5jdGlvbihlKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihlLmtleUNvZGUgPT09IDEzKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9kb0xpc3QuYWRkTmV3KHNlbGYubmV3VG9kbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV3VG9kbyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3RvZG9BZGROZXdDdHJsJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7XHJcbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
