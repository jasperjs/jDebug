module jDebug {
    export class JDebugUi {

        constructor() {

        }

        static initialize(compile:ng.ICompileService,
                          rootScope:ng.IScope,
                          components:jasper.core.HtmlComponentRegistrar) {
            components.register({
                name: 'jdebugManagePanel',
                ctrl: jDebug.JDebugManagePanel,
                template: `
                    <div ng-if="vm.settings.enabled" class="jdebug-panel">

                        <div class="jdebug-panel__drag"></div>
                        <div class="jdebug-panel__buttons-wrapper">
                            <label class="jdebug-panel__button">
                                <input ng-checked="vm.settings.styles" ng-click="vm.toggleStyles()" type="checkbox" />
                                <span>CSS</span>
                            </label>

                            <label class="jdebug-panel__button">
                                <input ng-checked="vm.settings.ctrls" ng-click="vm.toggleCtrls()" type="checkbox" />
                                <span>JS</span>
                            </label>

                            <label class="jdebug-panel__button">
                                <input ng-checked="vm.settings.templates" ng-click="vm.toggleTemplates()" type="checkbox" />
                                <span>HTML</span>
                            </label>

                            <label class="jdebug-panel__button">
                                <input ng-checked="vm.inspectorMode" ng-click="vm.toggleInspector()" type="checkbox" />
                                <span class="jdebug-panel__icon-button">
                                    <svg>
                                        <g id="search_14">
                                            <path d="M9.87146,9.16435l3.83565,3.83565l-0.707107,0.707107l-3.83565,-3.83565c-0.861926,0.70536 -1.96372,1.12854 -3.16435,1.12854c-2.76142,0 -5,-2.23858 -5,-5c0,-2.76142 2.23858,-5 5,-5c2.76142,0 5,2.23858 5,5c0,1.20063 -0.423181,2.30243 -1.12854,3.16435ZM6,2c2.20914,0 4,1.79086 4,4c0,2.20914 -1.79086,4 -4,4c-2.20914,0 -4,-1.79086 -4,-4c0,-2.20914 1.79086,-4 4,-4Z" style="fill-rule:evenodd;"></path>
                                          </g>
                                    </svg>
                                </span>
                            </label>
                        </div>


                    </div>
                `
            });

            var node = compile('<jdebug-manage-panel></jdebug-manage-panel>')(rootScope.$new())
            document.body.appendChild(node[0]);
        }

    }

    export interface IJDebugManagePanelSettings {
        ctrls: boolean;
        styles: boolean;
        templates: boolean;

        // does panel enabled?
        enabled: boolean;
    }

    /**
     *  Jasper component for manage panel, that render on the page
     */
    export class JDebugManagePanel {


        inspectorMode:boolean = false;
        settings:IJDebugManagePanelSettings;

        private storageKey:string = '_jdebug';

        constructor() {
            this.readSettings();
            this.applySettings();
        }

        toggleStyles() {
            this.settings.styles = !this.settings.styles;
            this.saveSettings();
            this.applySettings();
        }

        toggleScripts() {
            this.settings.ctrls = !this.settings.ctrls;
            this.saveSettings();
            this.applySettings();
        }

        toggleTemplates() {
            this.settings.templates = !this.settings.templates;
            this.saveSettings();
            this.applySettings();
        }

        toggleInspector() {
            this.inspectorMode = !this.inspectorMode;
            if (this.inspectorMode) {
                jDebug.currentInspector.enable();
            } else {
                jDebug.currentInspector.disable();
            }
        }

        disable() {
            this.settings.enabled = false;
            this.saveSettings();
        }

        private readSettings() {
            var settingsData = localStorage[this.storageKey];
            if (!settingsData) {
                //default settings:
                this.settings = {
                    ctrls: true,
                    styles: true,
                    templates: true,
                    enabled: true
                };
                this.saveSettings();
                return;
            }
            this.settings = JSON.parse(localStorage[this.storageKey]);
        }

        private applySettings() {
            jDebug.dispatcher.templatesEnabled = this.settings.templates;
            jDebug.dispatcher.stylesEnabled = this.settings.styles;
            jDebug.dispatcher.ctrlsEnabled = this.settings.ctrls;
        }

        private saveSettings() {
            localStorage[this.storageKey] = JSON.stringify(this.settings);
        }
    }
}