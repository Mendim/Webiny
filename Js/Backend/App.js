import Webiny from 'Webiny';
import Container from 'Core/Backend/Container';

const app = new Webiny.App('Core.Backend');
app.setInitialElement(React.createElement(Container));
app.beforeRender(() => {
    const authenticationApp = WebinyBootstrap.config.authentication || 'Core.Backend';
    // Load other backend apps
    const api = new Webiny.Api.Endpoint('/services/core/apps');
    return api.get('/backend').then(res => {
        let apps = Q();
        _.forIn(res.getData(), config => {
            apps = apps.then(() => {
                return WebinyBootstrap.includeApp(config.name, config).then(appInstance => {
                    // Filter modules
                    const modules = config.modules;
                    if (config.name !== authenticationApp) {
                        delete modules['Authentication'];
                    }

                    appInstance.addModules(modules);
                    _.set(Webiny.Apps, config.name, appInstance);
                    appInstance.run();
                });
            });
        });
        return apps;
    });
});

Webiny.Console.setEnabled(true);

/**
 * Injector example usage
 */
class Config {
    constructor() {
        console.log('Me being constructed!');
        this.name = 'UBER CONFIG';
    }
}

class Test {
    constructor(config) {
        console.log('TEST CONFIG', config.name);
        config.name = 'Pavel changed me!';
    }
}

Webiny.Injector.constant('Cmp', Config);
Webiny.Injector.service('Config', Config);
Webiny.Injector.service('Test', Test, 'Config');


export default app;
