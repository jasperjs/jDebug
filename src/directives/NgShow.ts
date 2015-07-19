module jDebug.directives.ngShow {
    export function create($animate:any):ng.IDirective {
        return {
            restrict: 'A',
            multiElement: true,
            compile: function () {
                return {
                    post: function (scope, element, attr:any) {
                        function ngShowWatchAction(value) {
                            // we're adding a temporary, animation-specific class for ng-hide since this way
                            // we can control when the element is actually displayed on screen without having
                            // to have a global/greedy CSS selector that breaks when other animations are run.
                            // Read: https://github.com/angular/angular.js/issues/9103#issuecomment-58335845
                            $animate[value ? 'removeClass' : 'addClass'](element, NG_HIDE_CLASS, {
                                tempClasses: NG_HIDE_IN_PROGRESS_CLASS
                            });
                        }

                        var w = scope.$watch(attr.ngShow, ngShowWatchAction);
                        onJDebugCmpDestroy(scope, element, () => w());
                    }
                }
            }

        };
    }
}
