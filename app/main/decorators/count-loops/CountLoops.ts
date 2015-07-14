module spa.main.decorators {
    export class CountLoops {
        // inject services here
        static $inject = ['$rootScope'];

        constructor($rootScope:ng.IScope) {
            if (!window['digestCount']) {
                window['digestCount'] = 0;
            }
            $rootScope.$watch(()=> {
                window['digestCount']++;
                return null;
            }, ()=> {

            });
        }

    }
}