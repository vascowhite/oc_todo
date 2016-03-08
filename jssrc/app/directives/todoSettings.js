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