module spa.main.components {
    export class MyButton {
        // inject services here
        static $inject = [];

        name:string = 'my-button';
        color:string;

        constructor() {
            //place your initialize logic here
        }

        link(element: HTMLElement){
            console.log('m');
        }

        change() {
            this.color = 'blue';
        }
    }
}