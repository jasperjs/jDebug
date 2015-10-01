module jDebug.inspector {

    export class JDebugInspector {

        private nodesMap:IJDebugNodesMap = new JDebugNodesMap();

        private docMoveHandler = (e)=> this.onDocumentMove(e);
        private currentComponentNode:Node;

        private onComponentClickHandler = (e)=>this.onComponentClick(e);

        // ui components:
        private selector:JDebugComponentSelector = new JDebugComponentSelector();
        private componentInfoWindow:JDebugComponentInfoWindow;

        private ignoreComponents = ['jdebugManagePanel', 'jdebugComponentInfo'];

        // current has focus (user clicked on them)
        private focused:boolean;
        private focusedNode:Element;

        constructor(compile:ng.ICompileService,
                    rootScope:ng.IScope,
                    components:jasper.core.HtmlComponentRegistrar,
                    private dispatcher:JDebugEventDispatcher) {
            this.componentInfoWindow = new JDebugComponentInfoWindow(rootScope, compile, components);
            this.componentInfoWindow.hide();

            this.componentInfoWindow.onParent(()=> {
                this.selectParentComponent();
            });
            this.componentInfoWindow.onClose(()=> {
                this.clearFocus();
            });
            this.componentInfoWindow.onNavigate((path)=> {
                this.navigateTo(path);
            });
        }

        addComponentNode(node:Node, jasperComponent:jasper.core.IHtmlComponentDefinition, ctrlInstance: any) {
            for (var i = 0; i < this.ignoreComponents.length; i++) {
                var ignoreComponent = this.ignoreComponents[i];
                if (ignoreComponent === jasperComponent.name) {
                    return;
                }
            }
            this.nodesMap.addComponent(node, this.mapToComponentInfo(jasperComponent, ctrlInstance));
        }

        enable() {
            document.addEventListener('mousemove', this.docMoveHandler);
        }

        disable() {
            this.deselectCurrentNode();
            document.removeEventListener('mousemove', this.docMoveHandler);
            this.selector.disable();
            this.componentInfoWindow.hide();
            this.focused = false;
        }

        onDocumentMove(e) {
            if (this.focused) {
                return;
            }
            var target:Node = e.target;
            var info = this.nodesMap.findComponentForNode(target);
            if (info) {
                this.hoverComponent(info.node, info.component);
            }
        }

        private selectParentComponent() {
            if (!this.focused) {
                return;
            }
            var parent = this.focusedNode.parentNode;
            if (!parent) {
                return;
            }
            var info = this.nodesMap.findComponentForNode(parent);
            if (info) {
                this.hoverComponent(info.node, info.component);
                this.focusHoverNode();
            }
        }


        private navigateTo(path:string) {
            this.dispatcher.send({
                type: 'ide_open',
                data: path
            });
        }

        private deselectCurrentNode() {
            if (this.currentComponentNode) {
                var clsList = this.currentComponentNode['classList'];
                if (clsList) {
                    clsList.remove('jdebug-inspector-hover');
                }
                this.unbindCurrentNode();
                this.currentComponentNode = null;
            }
        }

        private onComponentClick(e) {

            if (this.focused) {
                this.clearFocus();
            } else {
                this.focusHoverNode();
            }

            e.preventDefault();
            e.stopPropagation();
        }

        private clearFocus() {
            this.focused = false;
            this.focusedNode = null;
            this.componentInfoWindow.hide();
        }

        private focusHoverNode() {
            var info = this.nodesMap.findComponentForNode(this.currentComponentNode);
            if (info) {
                this.focused = true;
                this.focusedNode = <Element>info.node;
                this.componentInfoWindow.show(info.component, <Element>info.node);
            }
        }

        private hoverComponent(node:Node, info:ComponentInfo) {
            if (this.currentComponentNode === node) {
                return;
            }
            this.deselectCurrentNode();
            this.bindCurrentNode(node);

            this.selector.moveTo(info, <Element>node);
            var clsList = this.currentComponentNode['classList'];
            if (clsList) {
                clsList.add('jdebug-inspector-hover');
            }
        }

        private unbindCurrentNode() {
            if (this.currentComponentNode) {
                this.currentComponentNode.removeEventListener('click', this.onComponentClickHandler, true);
                this.currentComponentNode = null;
            }
        }

        private bindCurrentNode(node:Node) {
            this.currentComponentNode = node;
            this.currentComponentNode.addEventListener('click', this.onComponentClickHandler, true);
        }

        private mapToComponentInfo(def:jasper.core.IHtmlComponentDefinition, ctrlInstance: any):ComponentInfo {
            var info = new ComponentInfo();
            info.path = def.jDebug ? def.jDebug.path : '';
            info.templateFile = def.templateUrl;
            info.properties = def.properties;
            info.ctrl = ctrlInstance;
            info.events = def.events;
            info.name = def.name;
            info.attributes = def.attributes;
            return info;
        }
    }
}