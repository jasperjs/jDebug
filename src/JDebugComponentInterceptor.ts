/// <reference path="../typed/angular.d.ts" />
/// <reference path="../typed/jquery.d.ts" />
module jDebug {

    interface IDirectiveDefinitionCollection {
        [name: string]: DirectiveDefinition;
    }

    class DirectiveDefinition {
        ddo:ng.IDirective;
        templateElement:JQuery;

        instances:DirectiveInstance[] = [];

        addInstance(instance:DirectiveInstance) {
            this.instances.push(instance);
        }

        removeInstance(instance:DirectiveInstance) {
            var indx = this.instances.indexOf(instance);
            if (indx >= 0) {
                this.instances.splice(indx, 1);
            }
        }
    }

    class DirectiveInstance {
        element:JQuery;
        scope:ng.IScope;
    }

    export class JDebugComponentInterceptor {

        static repeatDirectives = ['ng-repeat'];

        private definitions:IDirectiveDefinitionCollection = {};

        constructor(private templateCache:ng.ITemplateCacheService, private compile:ng.ICompileService, private http:ng.IHttpService) {

        }

        onCompile(directive:ng.IDirective, tElement:JQuery) {
            if (this.definitions[directive.name]) {
                return;
            }
            var definition = new DirectiveDefinition();
            definition.ddo = directive;
            definition.templateElement = tElement.clone();
            this.definitions[directive.name] = definition;
        }

        onLink(directive:ng.IDirective, scope:ng.IScope, iElement:JQuery) {
            var definition = this.definitions[directive.name];
            if (definition) {
                var instance = new DirectiveInstance();
                instance.element = iElement;
                instance.scope = scope;

                definition.addInstance(instance);
                instance.element.on('$destroy', ()=> {
                    scope.$destroy();
                    definition.removeInstance(instance);
                });
            }
        }

        /**
         * templateUrl of the component has been updated
         * @param name      name of the component
         */
        updateComponentTemplateUrl(name:string) {
            var definition = this.definitions[name];
            if (definition) {
                if(!definition.ddo.templateUrl){
                    console.error('Component with name ', name, ' does not has a templateUrl parameter');
                    return;
                }
                this.updateTemplate(definition.ddo.templateUrl).then(()=>{
                    this.updateComponent(definition);
                });
            }
        }

        private updateComponent(definition:DirectiveDefinition) {
            // component repeated via ng-repeat
            var isRepeatedComponent = this.isRepeatTemplate(definition.templateElement);
            for (var i = definition.instances.length - 1; i >= 0; i--) {

                var instance = definition.instances[i];
                var directiveScope = instance.element['scope']();
                if (!directiveScope) {
                    directiveScope = instance.scope.$parent;
                }

                var updateComponent = () => {
                    var compileResult = this.compile(definition.templateElement.clone());
                    var newElement = compileResult(directiveScope);
                    instance.element.replaceWith(newElement);
                };

                if (isRepeatedComponent) {
                    if (i === 0) {// last repeated component, update it
                        updateComponent();
                    }
                    else {
                        instance.element.remove(); // just remove copy
                    }
                } else {
                    updateComponent();
                }
            }

        }

        private updateTemplate(url:string):ng.IPromise<any> {
            this.templateCache.remove(url);
            return this.http.get(url).then(result => this.templateCache.put(url, result.data));
        }

        private isRepeatTemplate(element:JQuery):boolean {
            for (var i = 0; i < JDebugComponentInterceptor.repeatDirectives.length; i++) {
                if (element.attr(JDebugComponentInterceptor.repeatDirectives[i])) {
                    return true;
                }
            }
            return false;
        }

    }


}