module jDebug.inspector {
    export interface IJDebugNodesMap {
        findComponentForNode(node:Node):IJDebugInspectorFoundNode;
        addComponent(node:Node, component:ComponentInfo);
    }

    export interface IJDebugInspectorFoundNode {
        node: Node;
        component: ComponentInfo;
    }

    export class JDebugNodesMap implements IJDebugNodesMap {

        private isSupportWeakMap:boolean = typeof(window['WeakMap']) !== 'undefined';
        private weakNodesMap;

        constructor(){
            if(this.isSupportWeakMap){
                this.weakNodesMap = new window['WeakMap']();
            }
        }

        addComponent(node:Node, component:ComponentInfo) {
            if (!this.isSupportWeakMap) {
                return;
            }

            this.weakNodesMap.set(node, component);
        }


        findComponentForNode(node:Node):IJDebugInspectorFoundNode {
            if (!this.isSupportWeakMap) {
                return;
            }

            var currentNode = node;
            while (currentNode) {
                var component = this.getComponentForNode(currentNode);
                if (component) {
                    return {
                        node: currentNode,
                        component: component
                    }
                }
                currentNode = node.parentNode;
            }

            return null;
        }

        private getComponentForNode(node:Node):ComponentInfo {
            if (this.weakNodesMap.has(node) || !this.weakNodesMap.has(node)) {
                return null;
            }
            return this.weakNodesMap.get(node);
        }

    }
}