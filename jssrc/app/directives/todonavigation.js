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