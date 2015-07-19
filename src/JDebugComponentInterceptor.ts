module jDebug {
    class DirectiveDefinition {
        ddo:ng.IDirective;
        name:string;
        tempalteId:string;
        cloneTemplateElement:JQuery;
        transcludeContent:any;

        parentScope:ng.IScope;
        instances:DirectiveInstance[] = [];

        hasInstances:boolean;

        addInstance(instance:DirectiveInstance) {
            this.instances.push(instance);
            this.hasInstances = true;
        }

        // TODO remove definition if no instances
        removeInstance(instance:DirectiveInstance) {
            var indx = this.instances.indexOf(instance);
            if (indx >= 0) {
                this.instances.splice(indx, 1);
            }
            this.hasInstances = this.instances.length > 0;
        }
    }

    class DirectiveInstance {
        element:JQuery;
    }

    export class JDebugComponentInterceptor implements jasper.core.IDirectiveInterceptor {

        static repeatDirectives = ['ng-repeat'];
        private definitions:DirectiveDefinition[] = [];

        constructor(private templateCache:ng.ITemplateCacheService,
                    private compile:ng.ICompileService,
                    private http:ng.IHttpService,
                    private scripts:JDebugScriptManager,
                    private registrar:jasper.core.HtmlComponentRegistrar) {
        }

        onRegister(component:jasper.core.IHtmlComponentDefinition) {
            var ddo = this.registrar.createDirectiveFor(component);
            this.registerProxyDirective(component.name, ddo);
        }

        onCompile(directive:ng.IDirective, tElement:JQuery, tAttrs:any, transcludeFn:any) {
            //
        }

        onMount(directive:ng.IDirective, scope:ng.IScope, iElement:JQuery, attrs, transclude) {
            var elementDebugId = iElement.attr(directiveIdKey);
            if (!elementDebugId) {
                console.warn('jDebug: mounted directive \"' + directive.name + '\" dont have a debugid');
                return;
            }

            var definitions = this.definitions.filter((d:DirectiveDefinition)=> {
                return d.tempalteId === elementDebugId;
            });

            if (definitions.length === 0) {
                console.warn('jDebug: mounted directive with name \"' + directive.name + '\", debugId: \"' + elementDebugId + '\" not found');
                return;
            }

            if (definitions.length > 1) {
                console.warn('jDebug: multiple components with name \"' + directive.name + '\" found');
                return;
            }

            var definition:DirectiveDefinition = definitions[0];

            var instance = new DirectiveInstance();
            instance.element = iElement;

            instance.element.on('$destroy', ()=> {
                scope.$destroy();
                definition.removeInstance(instance);
            });

            definition.addInstance(instance);
        }

        /**
         * Controller (*.js file) of the component has been updated
         * @param name
         * @param src
         */
        updateComponentDefinition(component:jasper.core.IHtmlComponentDefinition, src?:string) {
            var definitions = this.getDefinitionsByName(component.name);
            if (definitions.length) {
                var update = () => {
                    var ddo = this.registrar.createDirectiveFor(component);
                    var proxyDdo = this.createProxyDirective(component.name, ddo);
                    updateDirectiveDefinition(component.name, [ddo, proxyDdo]);
                    this.updateComponents(definitions);
                };

                if (src) {
                    this.scripts.updateScript(src, () => update());
                } else {
                    update();
                }

            } else {
                console.warn('jDebug: component with name \"' + component.name + '\" not registered in the application.');
            }
        }


        /**
         * templateUrl of the component has been updated
         * @param name      name of the component
         */
        updateComponentTemplateUrl(name:string) {
            var definitions = this.getDefinitionsByName(name);
            if (definitions.length) {
                var templateUrl = definitions[0].ddo.templateUrl;
                if (!templateUrl) {
                    console.error('jDebug: component with name ', name, ' does not has a templateUrl parameter');
                    return;
                }
                this.updateTemplate(templateUrl).then(() => this.updateComponents(definitions));
            } else {
                console.warn('jDebug: component with name \"' + name + '\" not registered in the application.');
            }
        }

        private getDefinitionsByName(name:string):DirectiveDefinition[] {
            return this.definitions.filter(d=>d.name === name);
        }

        private updateComponents(definitions:DirectiveDefinition[]) {
            definitions.forEach(d=>this.updateComponent(d));
        }

        private updateComponent(definition:DirectiveDefinition) {
            var directiveScope = definition.parentScope;
            for (var i = definition.instances.length - 1; i >= 0; i--) {

                var instance = definition.instances[i];

                if (i === 0) {
                    // the last instance, update it
                    var parent = definition.cloneTemplateElement.clone();

                    if (definition.ddo.transclude && definition.transcludeContent) {
                        var transcludeContent = definition.transcludeContent.clone();
                        if (transcludeContent) {
                            parent.append(transcludeContent);
                        }
                        var compileResult = this.compile(parent);
                        var newElement = compileResult(directiveScope);
                        updateDomElement(instance.element, newElement, directiveScope);
                    } else {
                        var compileResult = this.compile(parent);
                        var newElement = compileResult(directiveScope);
                        updateDomElement(instance.element, newElement, directiveScope);
                    }
                } else {
                    // just remove copy
                    removeDomElement(instance.element, directiveScope);
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

        private registerProxyDirective(name:string, original:ng.IDirective) {
            var ddo = this.createProxyDirective(name, original);

            this.registrar['directive'](name, ()=> ddo);
        }

        private createProxyDirective(name: string, original: ng.IDirective): ng.IDirective{
            return {
                restrict: original.restrict,
                transclude: false,
                scope: false,
                priority: 10000,
                compile: (tElement:JQuery, tAttrs:any)=> {

                    var definition = new DirectiveDefinition();
                    definition.name = name;
                    definition.cloneTemplateElement = tElement.clone();
                    definition.cloneTemplateElement.empty();

                    definition.ddo = original;
                    definition.tempalteId = jDebug.makeRandomId();
                    tElement.attr(directiveIdKey, definition.tempalteId);

                    if (original.transclude) {
                        definition.transcludeContent = tElement.contents().clone();
                    }

                    this.definitions.push(definition);

                    return {
                        pre: (scope:ng.IScope) => {
                            definition.parentScope = scope; //store component parent scope
                            // remove defintion if parent scope is destroyed

                            // we can't because parent scope can be recreated by ng-if, for instance...

                            //definition.parentScope.$on('$destroy', ()=> {
                            //    var indx = this.definitions.indexOf(definition);
                            //    if (indx >= 0) {
                            //        this.definitions.splice(indx, 1);
                            //    }
                            //});
                        }
                    };
                }
            };
        }

        private getDefinitionById(tid:string):DirectiveDefinition {
            for (var i = 0; i < this.definitions.length; i++) {
                var def = this.definitions[i];
                if (def.tempalteId === tid) {
                    return def;
                }
            }
            return undefined;
        }


    }


}