module jDebug.directives.ngIf {


    export function create($animate):ng.IDirective {
        return {
            multiElement: true,
            transclude: 'element',
            priority: 600,
            terminal: true,
            restrict: 'A',
            $$tlb: true,
            compile: function () {
                return {
                    post: function ($scope, $element, $attr:any, ctrl, $transclude) {
                        var block, childScope, previousElements, jDebugRegistered;
                        function ngIfWatchAction(value) {

                            if (value) {
                                if (!childScope) {
                                    $transclude(function (clone, newScope) {
                                        childScope = newScope;
                                        //pass jdebug id to current watch function
                                        if(clone.length === 1 && !jDebugRegistered){
                                            jDebugRegistered = true;
                                            onJDebugCmpDestroy($scope, clone, () => w());
                                        }

                                        clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
                                        // Note: We only need the first/last node of the cloned nodes.
                                        // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                        // by a directive with templateUrl when its template arrives.
                                        block = {
                                            clone: clone
                                        };

                                        $animate.enter(clone, $element.parent(), $element);
                                    });
                                }
                            } else {
                                if (previousElements) {
                                    previousElements.remove();
                                    previousElements = null;
                                }
                                if (childScope) {
                                    childScope.$destroy();
                                    childScope = null;
                                }
                                if (block) {
                                    previousElements = getBlockNodes(block.clone);
                                    $animate.leave(previousElements).then(function () {
                                        previousElements = null;
                                    });
                                    block = null;
                                }
                            }
                        }

                        var w = $scope.$watch($attr.ngIf, ngIfWatchAction);

                    }
                }
            }
        };
    }
}
