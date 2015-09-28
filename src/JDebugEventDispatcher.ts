module jDebug {

    export interface IJDebugMessage {
        type: number;
        data: any;
    }

    export class JDebugEventDispatcher {

        wsConnectionString:string;

        stylesEnabled: boolean = true;
        ctrlsEnabled: boolean = true;
        templatesEnabled: boolean = true;


        private ws:WebSocket;

        constructor() {
            var wsPrototocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

            this.wsConnectionString = wsPrototocol + '//' + location.host + '/jdebug';

        }

        connect() {
            if (!WebSocket) {
                console.warn('jDebug: websockets is not supported to debug the application');
                return;
            }
            this.ws = new WebSocket(this.wsConnectionString);
            this.ws.onclose = ()=> {
                setTimeout(this.connect.bind(this), 5000);
            };
            this.ws.onmessage = (event:MessageEvent)=> {
                this.dispatch(JSON.parse(event.data));
            };

            this.ws.onerror = ()=> {
                console.warn('jDebug: ws connection error');
            };
        }

        private dispatch(message:IJDebugMessage) {
            switch (message.type) {
                case 1: // template changed
                    if(!this.templatesEnabled){
                        return;
                    }
                    jDebug.components.updateComponentTemplateUrl(message.data.component);
                    break;
                case 2: // definition changed
                    if (this.isTypeSupported(message.data.type)) {
                        jDebug.components.updateComponentDefinition(message.data);
                    }
                    break;
                case 3: // ctrl changed
                    if(!this.ctrlsEnabled){
                        return;
                    }
                    if (this.isTypeSupported(message.data.def.type)) {
                        jDebug.components.updateComponentDefinition(message.data.def, message.data.src);
                    }
                    break;
                case 4: // css changed
                    if(!this.stylesEnabled){
                        return;
                    }
                    jDebug.styles.updateStyle(message.data);
                    break;
            }
        }

        private isTypeSupported(type:string) {
            return type === 'component' || type === 'page';
        }

    }
}