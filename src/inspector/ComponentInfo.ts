module jDebug.inspector {
    export class ComponentInfo{
        /**
         * System path to the component
         */
        path: string;

        name: string;

        templateFile: string;

        properties: string[];

        attributes: jasper.core.IAttributeBinding[];

        events: string[];

        // controller instance of this component
        ctrl: any;
    }
}