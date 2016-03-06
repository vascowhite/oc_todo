/**
 * Created by paul on 26/02/16.
 */
angular.module('todo').service('todoConnector',['$http', function todoConnector($http){
    this.fetch = function(callback){
        $http.get(OC.generateUrl('apps/todo/get')).then(function(data){
            var todoList = data.data.data.todos;
            var len = todoList.length;
            for(var i = 0; i < len; i++){
                todoList[i].todoNum = i;
            }
            callback(todoList);
        });
    }
}]);