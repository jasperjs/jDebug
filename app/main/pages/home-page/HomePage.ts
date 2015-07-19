module spa.main.pages {
	// /
    export class HomePage {
        // inject services here
        static $inject = [];

        copies: number[] = [0, 1];
        name: string = 'home-page';

        initializeComponent() {
            // place your initialize logic here
        }

        plus(){
            this.copies.push(this.copies.length + 1);
        }

        click(){
            this.name = 'changed';
        }

        update(name: string){
            jDebug.components.updateComponentTemplateUrl(name);
        }


        updateCode(def: any, scriptPath: string){
            jDebug.components.updateComponentDefinition(def, scriptPath);
        }

    }
}