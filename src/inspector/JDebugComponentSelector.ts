module jDebug.inspector {
    export class JDebugComponentSelector {

        selectorNode:HTMLElement;

        constructor() {
            this.selectorNode = document.createElement('div');
            this.selectorNode.classList.add('jdebug-inspector-selector');
            this.disable();
            document.body.appendChild(this.selectorNode);
        }

        moveTo(componentNode:Element) {
            var rect = this.calcRect(componentNode);
            this.selectorNode.style.left = rect.left + 'px';
            this.selectorNode.style.top = rect.top + 'px';
            this.selectorNode.style.height = (rect.bottom - rect.top) + 'px';
            this.selectorNode.style.width = (rect.right - rect.left) + 'px';

            this.enable();
        }

        enable() {
            this.selectorNode.style.display = 'block';
        }

        disable() {
            this.selectorNode.style.display = 'none';
        }

        destroy() {
            this.selectorNode.remove();
            this.selectorNode = null;
        }

        private calcRect(componentNode:Element):IRect {
            var rect = componentNode.getBoundingClientRect();
            var minLeft = rect.left, minTop = rect.top, maxBottom = rect.bottom, maxRight = rect.right;

            for (var i = 0; i < componentNode.childNodes.length; i++) {
                var childNode = <Element>componentNode.childNodes[i];
                if (!childNode.getBoundingClientRect) {
                    continue;
                }
                rect = childNode.getBoundingClientRect();
                if (rect.left < minLeft) {
                    minLeft = rect.left;
                }
                if (rect.top < minTop) {
                    minTop = rect.top;
                }
                if (rect.bottom > maxBottom) {
                    maxBottom = rect.bottom;
                }
                if (rect.right > maxRight) {
                    maxRight = rect.right;
                }
            }

            return {
                left: minLeft + window.pageXOffset,
                top: minTop + window.pageYOffset,
                right: maxRight + window.pageXOffset,
                bottom: maxBottom + window.pageYOffset
            };
        }


    }

    interface IRect {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }
}
