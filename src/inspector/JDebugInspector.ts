module jDebug.inspector {

    export class JDebugInspector {

        private nodesMap:IJDebugNodesMap = new JDebugNodesMap();

        private docMoveHandler = (e)=> this.onDocumentMove(e);
        private currentComponentNode:Node;

        private onComponentClickHandler = (e)=>this.onComponentClick(e);

        private selector:JDebugComponentSelector = new JDebugComponentSelector();

        private ignoreComponents = ['jdebugManagePanel'];

        addComponentNode(node:Node, jasperComponent:jasper.core.IHtmlComponentDefinition) {
            for (var i = 0; i < this.ignoreComponents.length; i++) {
                var ignoreComponent = this.ignoreComponents[i];
                if (ignoreComponent === jasperComponent.name) {
                    return;
                }
            }
            this.nodesMap.addComponent(node, this.mapToComponentInfo(jasperComponent));
        }

        enable() {
            document.addEventListener('mousemove', this.docMoveHandler);
        }

        disable() {
            this.deselectCurrentNode();
            document.removeEventListener('mousemove', this.docMoveHandler);
            this.selector.disable();
        }

        onDocumentMove(e) {
            var target:Node = e.target;
            var info = this.nodesMap.findComponentForNode(target);
            if (info) {
                this.selectNode(info.node);
            }
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
            var info = this.nodesMap.findComponentForNode(this.currentComponentNode);
            console.log(info.component);



            e.preventDefault();
            e.stopPropagation();
        }

        private selectNode(node:Node) {
            if (this.currentComponentNode === node) {
                return;
            }
            this.deselectCurrentNode();
            this.bindCurrentNode(node);

            this.selector.moveTo(<Element>node);
            var clsList = this.currentComponentNode['classList'];
            if (clsList) {
                clsList.add('jdebug-inspector-hover');
            }
        }

        private unbindCurrentNode() {
            if (this.currentComponentNode) {
                this.currentComponentNode.removeEventListener('click', this.onComponentClickHandler);
                this.currentComponentNode = null;
            }
        }

        private bindCurrentNode(node:Node) {
            this.currentComponentNode = node;
            this.currentComponentNode.addEventListener('click', this.onComponentClickHandler);
        }

        private mapToComponentInfo(def:jasper.core.IHtmlComponentDefinition):ComponentInfo {
            var info = new ComponentInfo();
            info.path = def.jDebug ? def.jDebug.path : '';
            info.templateFile = def.templateUrl;//TODO pass templateFile to jDebug object
            info.ctrl = def.ctrl || def.ctor;
            return info;
        }
    }
}