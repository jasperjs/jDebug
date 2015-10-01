/// <reference path="../typed/angular.d.ts" />
/// <reference path="../typed/jquery.d.ts" />
module jDebug {
    export var components:JDebugComponentInterceptor;
    export var scripts:JDebugScriptManager;
    export var styles:JDebugStylesManager;
    export var directiveIdKey = 'jdebug-id';
    export var repeatDirectives = ['ng-repeat'];
    export var currentInspector: inspector.JDebugInspector;

    export var dispatcher: JDebugEventDispatcher;

    var services:jasper.core.ServiceRegistrar, animate:ng.IAnimateService;
    var injector:JDebugDirectiveInjector;

    var transclusions:TransclusionElement[] = [];

    class TransclusionElement {
        clone:any;
        id:string;
    }

    export function initializeDebug() {
        if (!angular || !jasper) {
            console.error('Page must reference AngularJS and JasperJS scripts');
            return;
        }
        var appRootElement = document.querySelector('[ng-app]') ||
            document.querySelector('[j-debug-root]') || document;

        var angularInjector = angular.element(appRootElement).injector();
        if (!angularInjector) {
            console.error('Could not find an injector. Mark application root DOM node with ng-app or j-debug-root attribute');
            return;
        }

        // scripts
        scripts = new JDebugScriptManager(new jasper.areas.JasperResourcesManager());

        // styles
        styles = new JDebugStylesManager();

        var $rootScope = <ng.IScope>angularInjector.get('$rootScope');
        var $compile = <ng.ICompileService>angularInjector.get('$compile');
        var $templateCache = <ng.ITemplateCacheService>angularInjector.get('$templateCache');
        var $http = <ng.IHttpService>angularInjector.get('$http');
        var jasperComponentRegistrar = <jasper.core.HtmlComponentRegistrar>angularInjector.get('jasperComponent');
        services = <jasper.core.ServiceRegistrar>angularInjector.get('jasperService');
        animate = <ng.IAnimateService>angularInjector.get('$animate');

        dispatcher = new JDebugEventDispatcher();
        currentInspector = new inspector.JDebugInspector($compile, $rootScope, jasperComponentRegistrar, dispatcher);
        components = new JDebugComponentInterceptor($templateCache, $compile, $http, scripts, jasperComponentRegistrar, currentInspector);

        if (jasperComponentRegistrar.setInterceptor) {
            jasperComponentRegistrar.setInterceptor(components);
        }

        overrideInjector(angularInjector);
        // override default directives:
        overrideDirectives();

        JDebugUi.initialize($compile, $rootScope, jasperComponentRegistrar);
        dispatcher.connect();
    }

    export function makeRandomId():string {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }


    /**
     * Function override default angularjs directives like ngIf, ngShow, ngHide
     * because they creates a watchers that we need to unregister when destroy single component.
     *
     * New directives marks watchers with special id, that we can remove it when recreate a component.
     */
    function overrideDirectives() {
        var parse = injector.get('$parse');
        var directivesToOverride = {
            ngIf: directives.ngIf.create(animate),
            ngShow: directives.ngShow.create(animate),
            ngHide: directives.ngHide.create(animate),
            ngRepeat: directives.ngRepeat.create(parse, animate)
        };
        Object.keys(directivesToOverride).forEach(key=> {
            updateDirectiveDefinition(key, [directivesToOverride[key]])
        });
    }

    export function destroyNewScopeOnElm(elm:JQuery, parentScope:ng.IScope) {
        var elmScope:ng.IScope = elm['scope']();
        if (elmScope.$id !== parentScope.$id) {
            elmScope.$destroy();
        }
    }

    export function updateDomElement(oldElm:JQuery, newElm:JQuery, parentScope:ng.IScope) {
        destroyNewScopeOnElm(oldElm, parentScope);
        destroyExternalWatchers(parentScope, oldElm.attr(directiveIdKey));
        oldElm.replaceWith(newElm);
    }

    export function removeDomElement(elm:JQuery, parentScope:ng.IScope) {
        destroyNewScopeOnElm(elm, parentScope);
        elm.remove();
    }

    function destroyExternalWatchers(scope:ng.IScope, debugId:string) {
        scope.$broadcast('jdebug:destroy', debugId);
    }

    export function onJDebugCmpDestroy(scope:ng.IScope, element:ng.IAugmentedJQuery, callback:Function) {
        var debugId = element.attr(directiveIdKey);
        if (!debugId) return;
        var sub = scope.$on('jdebug:destroy', (e, id)=> {
            if (id === debugId) {
                sub();
                callback();
            }
        });
    }

    export function updateDirectiveDefinition(name:string, ddos:ng.IDirective[]) {
        ddos.forEach((ddo, index)=> {
            ddo.name = name;
            ddo.priority = ddo.priority || 0;
            ddo['index'] = index;
            ddo.require = ddo.require || (ddo.controller && ddo.name);
            ddo.restrict = ddo.restrict || 'EA';
            var bindings = {isolateScope: {}, bindToController: null};
            if (typeof(ddo.scope) !== 'object') {
                bindings.isolateScope = null;
            }
            ddo['$$bindings'] = bindings;
            if (bindings.isolateScope) {
                ddo['$$isolateBindings'] = bindings.isolateScope;
            }
        });

        injector.updateDirective(name, ()=> ddos);
    }

    export function markElementAsTransclude(element:ng.IAugmentedJQuery) {
        var id = makeRandomId();
        element.attr('jdebug-tid', id);
        var t = new TransclusionElement();
        t.clone = element.clone();
        transclusions.push(t);
    }

    export function isRepeatTemplate(element:JQuery):boolean {
        for (var i = 0; i < repeatDirectives.length; i++) {
            if (element.attr(repeatDirectives[i])) {
                return true;
            }
        }
        return false;
    }

    function overrideInjector(angularInjector) {
        injector = new JDebugDirectiveInjector(angularInjector);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    jDebug.initializeDebug();
});