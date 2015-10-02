module jDebug.inspector {

    export class JDebugComponentInfoWindow {

        private infoScope:IJDebugComponentInfoScope;
        private infoNode:HTMLElement;

        constructor(rootScope:ng.IScope, compile:ng.ICompileService, components:jasper.core.HtmlComponentRegistrar) {

            this.infoScope = <IJDebugComponentInfoScope>rootScope.$new();
            components.register({
                name: 'jdebugComponentInfo',
                ctrl: JDebugComponentInfo,
                properties: ['component', 'show'],
                events: ['parent', 'close', 'navigate'],
                template: `
                    <div class="jdebug-component-info" ng-if="vm.show">
                        <button type="button" class="jdebug-component-info__close-button" ng-click="vm.closeWindow()">
                            <svg><g> <path d="M21,2.28l-9.14,9.15l-9.14,-9.15l-0.72,0.72l9.15,9.14l-9.15,9.14l0.72,0.72l9.14,-9.15l9.14,9.15l0.72,-0.72l-9.15,-9.14l9.15,-9.14l-0.72,-0.72Z" style="fill-rule:evenodd;"></path> </g></svg>
                        </button>
                        <div class="jdebug-component-info__title-wrapper">
                            <h4 class="jdebug-component-info__title">{{vm.componentTagname}}</h4>
                        </div>

                        <div class="jdebug-component-info__body">
                            <p style="color:red" ng-if="vm.isLegacyApi">Used legacy attributes bindings!</p>
                            <p ng-if="vm.properties">
                                <span class="jdebug-component-info__sub-header">Properties</b>
                                <ul>
                                    <li ng-repeat="prop in vm.properties">
                                        <span class="jdebug-component-info__sub-prop">{{::prop.propertyName}}:</span> <span class="jdebug-component-info__sub-val"><span ng-if="prop.propertyValue">{{::prop.propertyValue}}</span><em ng-if="!prop.propertyValue">not specified</em></span>
                                    </li>
                                </ul>
                            </p>
                            <p ng-if="vm.events">
                                <span class="jdebug-component-info__sub-header">Events:</span> <span ng-repeat="evnt in vm.events" class="jdebug-component-info__sub-val-coma">{{::evnt.eventName}}</span>
                            </p>
                            <p>
                                <a class="jdebug-component-info__button" ng-if="vm.component.templateFile" href="" title="{{vm.component.templateFile}}" ng-click="vm.navigateToTemplate()">template</a>
                                <a class="jdebug-component-info__button" ng-if="vm.component.path" href="" title="{{vm.component.path}}" ng-click="vm.navigateToDef()">definition</a>
                                <a class="jdebug-component-info__button" href="" ng-click="vm.navigateToParent()">parent component</a>
                            </p>
                        </div>
                    </div>
                `
            });
            var node = compile('<jdebug-component-info bind-show="show" bind-component="component" on-navigate="onNavigate($event)" on-close="onClose()" on-parent="onParent()"></jdebug-component-info>')(this.infoScope);
            this.infoNode = node[0];
            document.body.appendChild(this.infoNode);
        }

        show(componentInfo:ComponentInfo, element:Element) {
            this.infoScope.show = true;
            this.infoScope.component = componentInfo;
            this.safeApply();
            var windowNode = <HTMLElement>this.infoNode.getElementsByClassName('jdebug-component-info')[0];

            var rect = element.getBoundingClientRect();

            var infoWindowWIdth = windowNode.clientWidth + 20 /* padding-left*/, infoWindowHeight = windowNode.clientHeight + 20 /*padding bottom*/;

            var left = rect.left + window.pageXOffset, top = rect.top + window.pageYOffset;
            var diffX = rect.left + infoWindowWIdth - window.innerWidth, diffY = rect.top + infoWindowHeight - window.innerHeight;
            if (diffX > 0) {
                left = left - diffX;
            }
            if (diffY > 0) {
                top = top - diffY;
            }


            windowNode.style.top = top + 'px';
            windowNode.style.left = left + 'px';
        }

        hide() {
            this.infoScope.show = false;
            this.infoScope.component = null;
            this.safeApply();
        }

        onParent(cb:Function) {
            this.infoScope.onParent = cb;
        }

        onClose(cb:Function) {
            this.infoScope.onClose = cb;
        }

        onNavigate(cb:Function) {
            this.infoScope.onNavigate = cb;
        }

        private safeApply() {
            if (!this.infoScope.$$phase) {
                this.infoScope.$digest();
            }
        }
    }

    /**
     *
     */
    export class JDebugComponentInfo {
        //events:
        parent:jasper.core.IEventEmitter;
        close:jasper.core.IEventEmitter;
        navigate:jasper.core.IEventEmitter;

        // props:
        component:ComponentInfo;
        show:boolean;

        //fields:
        properties:IJDebugComponentProperty[];
        events:IJDebugComponentEvent[];

        isLegacyApi:boolean;
        componentTagname: string;

        component_change() {
            if (this.component) {
                this.componentTagname = this.shakeCase(this.component.name);

                if (this.component.properties || this.component.events) {
                    // properties
                    if (this.component.properties) {
                        this.isLegacyApi = false;
                        this.properties = [];
                        for (var i = 0; i < this.component.properties.length; i++) {
                            var propertyName = this.component.properties[i];
                            var property:IJDebugComponentProperty = {
                                propertyName: propertyName,
                                propertyValue: this.getCtrlPropertyValue(propertyName)
                            };
                            this.properties.push(property);
                        }
                    } else {
                        this.properties = null;
                    }

                    if (this.component.events) {
                        this.isLegacyApi = false;
                        this.events = [];
                        for (var i = 0; i < this.component.events.length; i++) {
                            var eventName = this.component.events[i];
                            var event:IJDebugComponentEvent = {
                                eventName: 'on-' + eventName
                            };
                            this.events.push(event);
                        }
                    } else {
                        this.events = null;
                    }
                } else if (this.component.attributes) {
                    //legacy attributes
                    this.isLegacyApi = true;
                    this.properties = [];
                    this.events = [];
                    for (var i = 0; i < this.component.attributes.length; i++) {
                        var attrBinding = this.component.attributes[i];
                        switch (attrBinding.type) {
                            case 'expr':
                            case 'event':
                                this.events.push({
                                    eventName: attrBinding.name
                                });
                                break;
                            default:
                                this.properties.push({
                                    propertyName: attrBinding.name,
                                    propertyValue: this.getCtrlPropertyValue(attrBinding.name)
                                });
                                break;
                        }
                    }
                } else{
                    this.properties = null;
                    this.events = null;
                    this.isLegacyApi = false;
                }
            }
        }

        navigateToParent() {
            this.parent.next();
        }

        navigateToDef() {
            this.navigate.next(this.component.path);
        }

        navigateToTemplate() {
            this.navigate.next(this.component.templateFile);
        }

        closeWindow() {
            this.close.next();
        }

        private getCtrlPropertyValue(attrName:string):string {
            if (this.component.ctrl) {
                var ctrlProperty = this.camelCaseTagName(attrName);
                if (this.component.ctrl[ctrlProperty]) {
                    var val = JSON.stringify(this.component.ctrl[ctrlProperty], null, 2);
                    return val.length > 150 ? val.substr(0, 150) + '...' : val;
                }
            }
            return null;
        }

        private camelCase(name:string):string {
            var regex = /[A-Z]/g;
            return name.replace(regex, function (letter, pos) {
                return pos ? letter : letter.toLowerCase();
            });
        }

        private  camelCaseTagName(tagName:string):string {
            if (tagName.indexOf('-') < 0) {
                return this.camelCase(tagName);
            }

            return tagName.replace(/\-(\w)/g, function (match, letter) {
                return letter.toUpperCase();
            });
        }

        private shakeCase(name):string {
            var SNAKE_CASE_REGEXP = /[A-Z]/g;
            var separator = '-';
            return name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
                return (pos ? separator : '') + letter.toLowerCase();
            });
        }
    }


    interface IJDebugComponentInfoScope extends ng.IScope {
        show:boolean;
        component:ComponentInfo;

        onParent:Function;
        onNavigate:Function;
        onClose:Function;
    }

    export interface IJDebugComponentProperty {
        propertyName: string;
        propertyValue: string;
    }

    export interface IJDebugComponentEvent {
        eventName: string;
    }
}