import React from 'react';
import Webiny from 'webiny';

class NewModule extends Webiny.App.Module {

    init() {
        this.name = 'NewModule';
        const Menu = Webiny.Ui.Menu;
        const role = 'webiny-new-module';

        this.registerMenus(
            <Menu label="System" icon="icon-tools">
                <Menu label="New Module" route="Logger.ListErrors" role={role}/>
            </Menu>
        );
    }
}

export default NewModule;