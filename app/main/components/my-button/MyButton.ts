module spa.main.components {
    export class MyButton {
        // inject services here
        static $inject = [];

        name:string = 'my-button';
        color:string;

        constructor() {
            //place your initialize logic here
        }

        change() {
            this.color = 'green';
        }

        link(element: HTMLElement, homePage: pages.HomePage, transclude){
            //console.log(homePage);
        }
    }
}