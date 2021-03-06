import Webiny from 'webiny';

class Module extends Webiny.App.Module {

    init() {
        this.name = 'UserAccount';

        this.registerRoutes(
            new Webiny.Route('Users.Account', '/acl/users/account', () => Webiny.import('Webiny/Skeleton/UserAccount'), 'Account Settings')
        );

        Webiny.registerModule(
            new Webiny.Module('Webiny/Skeleton/UserAccount', () => import('./UserAccount'))
        );
    }
}

export default Module;