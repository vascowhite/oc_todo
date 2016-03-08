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