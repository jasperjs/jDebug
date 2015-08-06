module jDebug.directives.ngHide {
    export function create($animate:any):ng.IDirective {
        return {
            restrict: 'A',
            multiElement: true,
            compile: function(){
                return {
                    post: function (scope, element, attr: any) {
                        function ngHideWatchAction(value) {
                            // The comment inside of the ngShowDirective explains why we add and
                            // remove a temporary class for the show/hide animation
                            $animate[value ? 'addClass' : 'removeClass'](element, NG_HIDE_CLASS, {
                                tempClasses: NG_HIDE_IN_PROGRESS_CLASS
                            });
                        }
                        var w = scope.$watch(attr.ngHide, ngHideWatchAction);
                        onJDebugCmpDestroy(scope, element, () => w());
                    }
                }
            }
        };
    }
}