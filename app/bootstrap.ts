angular.module('app', [
    'ng',
    'ngRoute',
    'jasper',
    'jasperAreasConfig',
    'jasperRouteConfig'
]).config(['$locationProvider', 'jasperComponentProvider', function ($locationProvider, jasperComponentProvider) {
    $locationProvider.html5Mode(false).hashPrefix('!');
}]).run(function(){

});