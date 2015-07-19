module jDebug.directives {
    export var NG_HIDE_CLASS = 'ng-hide';
    export var NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';

    var NODE_TYPE_ELEMENT = 1;

    var uid = 0;

    /**
     * Return the DOM siblings between the first and last node in the given array.
     * @param {Array} array like object
     * @returns {jqLite} jqLite collection containing the nodes
     */
    export function getBlockNodes(nodes) {
        // TODO(perf): just check if all items in `nodes` are siblings and if they are return the original
        //             collection, otherwise update the original collection.
        var node = nodes[0];
        var endNode = nodes[nodes.length - 1];
        var blockNodes = [node];

        do {
            node = node.nextSibling;
            if (!node) break;
            blockNodes.push(node);
        } while (node !== endNode);

        return angular.element(blockNodes);
    }

    export function jqLite(elm) {
        return angular.element(elm);
    }

    export function minErr(...args):Function {
        return angular['$$minErr'].apply(this, args);
    }

    function nextUid(){
        return ++uid;
    }

    export function hashKey(obj, nextUidFn?) {
        var key = obj && obj.$$hashKey;

        if (key) {
            if (typeof key === 'function') {
                key = obj.$$hashKey();
            }
            return key;
        }

        var objType = typeof obj;
        if (objType == 'function' || (objType == 'object' && obj !== null)) {
            key = obj.$$hashKey = objType + ':' + (nextUidFn || nextUid)();
        } else {
            key = objType + ':' + obj;
        }

        return key;

    }

    export function createMap() {
        return Object.create(null);
    }

    function isWindow(obj) {
        return obj && obj.window === obj;
    }

    function isString(s){
        return angular.isString(s);
    }

    function isArray(s){
        return angular.isArray(s);
    }

    export function isArrayLike(obj) {
        if (obj == null || isWindow(obj)) {
            return false;
        }

        // Support: iOS 8.2 (not reproducible in simulator)
        // "length" in obj used to prevent JIT error (gh-11508)
        var length = "length" in Object(obj) && obj.length;

        if (obj.nodeType === NODE_TYPE_ELEMENT && length) {
            return true;
        }

        return isString(obj) || isArray(obj) || length === 0 ||
            typeof length === 'number' && length > 0 && (length - 1) in obj;
    }
}
