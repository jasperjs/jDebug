module jDebug.inspector {

    export class JDebugInspector {

        private nodesMap:IJDebugNodesMap = new JDebugNodesMap();

        private docMoveHandler = (e)=> this.onDocumentMove(e);
        private currentComponentNode:Node;

        addComponentNode(node:Node, jasperComponent:jasper.core.IHtmlComponentDefinition) {
            this.nodesMap.addComponent(node, this.mapToComponentInfo(jasperComponent));
        }

        enable() {
            document.addEventListener('mousemove', this.docMoveHandler);
        }

        disable() {
            this.deselectCurrentNode();
            document.removeEventListener('mousemove', this.docMoveHandler);
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
                    clsList.remove('jdebug-inspector-selected');
                }
                this.currentComponentNode = null;
            }
        }

        private selectNode(node:Node) {
            if(this.currentComponentNode === node){
                return;
            }

            this.deselectCurrentNode();
            this.currentComponentNode = node;
            var clsList = this.currentComponentNode['classList'];
            if (clsList) {
                clsList.add('jdebug-inspector-selected');
            }
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