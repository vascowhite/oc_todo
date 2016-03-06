/**
 * Created by paul on 13/02/16.
 */
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