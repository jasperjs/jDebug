module jDebug {
    export class JDebugStylesManager {

        constructor() {

        }

        updateStyle(href:string) {
            var linkTag = document.querySelector('link[href^="' + href + '"]');
            if (!linkTag) {
                console.warn('Style tag with href "' + href + '" not found in the DOM');
                return;
            }

            var noCacheHref = href + '?v=' + jDebug.makeRandomId();
            var newLink = document.createElement('link');
            newLink.setAttribute('rel', 'stylesheet');
            newLink.setAttribute('href', noCacheHref);

            document.head.appendChild(newLink);

            setTimeout(()=>{
                linkTag.parentNode.removeChild(linkTag);
            }, 100);
        }

    }
}