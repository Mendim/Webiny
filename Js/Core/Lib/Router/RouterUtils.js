import Webiny from 'Webiny';
import RouterEvent from './RouterEvent';

class RouterUtils {

    setBaseUrl(url) {
        this.baseUrl = url;
        return this;
    }

    /**
     * When using promises, in our case Q library which is based on ES6 Promise class, thrown exceptions are suppressed by default.
     * Q library has support for handling that by passing second parameter to `then()`, so this is the exceptionHandler we pass to Q
     * when we need to log those exceptions.
     *
     * @param e
     */
    exceptionHandler(e) {
        console.error(e);
    }

    matchRoute(_this, url) {
        url = this.sanitizeUrl(url);
        let matchedRoute = null;
        _.each(_this.routes, route => {
            if (route.match(url) && !matchedRoute) {
                matchedRoute = route;
                // console.log('%c[Router]: ' + url, 'color: #139C09; font-weight: bold');
            }
        });

        return matchedRoute;
    }

    /**
     * RENDER ROUTE
     * @param route
     */
    async renderRoute(route) {
        const content = await this.getRouteContent(route);
        if (route.getTitle()) {
            Webiny.Router.setTitle(route.getTitle());
        }
        await Webiny.ViewManager.render(content);
        return route;
    }

    sanitizeUrl(url) {
        return '/' + _.trimStart(url.replace(this.baseUrl, '').split('?').shift(), '/');
    }

    /**
     * BUILD `ROUTE WILL CHANGE` CHAIN
     * Create and execute chain of callbacks
     * @param matchedRoute
     * @param callbacks
     */
    routeWillChange(matchedRoute, callbacks) {
        function createLink(callback) {
            // Each chain link will receive a routerEvent instance from previous link
            return function chainLink(routerEvent) {
                if (!routerEvent.isStopped()) {
                    return callback(routerEvent);
                }

                if (routerEvent.goTo !== null) {
                    Webiny.Router.goToRoute(routerEvent.goTo, routerEvent.goToParams);
                }

                return routerEvent;
            };
        }

        // Execute before change callbacks in a chain
        const routerEvent = new RouterEvent(matchedRoute);
        let routeWillChangeChain = Promise.resolve(routerEvent);
        callbacks.forEach(callback => {
            routeWillChangeChain = routeWillChangeChain.then(createLink(callback), this.exceptionHandler);
        });

        // In the end we need to check if routerEvent is stopped and redirect to another route if requested
        return routeWillChangeChain.then(re => {
            if (re.isStopped() && re.goTo !== null) {
                Webiny.Router.goToRoute(re.goTo, re.goToParams);
            }

            return re;
        });
    }

    async getRouteContent(route) {
        const components = await route.getComponents();

        let defComponents = [];
        if (!route.skipDefaultComponents()) {
            defComponents = Webiny.Router.getDefaultComponents();
        }

        return _.merge({Layout: Webiny.Router.getLayout(route.layout)}, defComponents, components);
    }

    handleRouteNotMatched(url, callbacks) {
        const rEvent = new RouterEvent(url);
        let routeNotMatchedChain = Promise.resolve(rEvent);
        callbacks.forEach(callback => {
            routeNotMatchedChain = routeNotMatchedChain.then(() => {
                return callback(rEvent);
            }).catch(this.exceptionHandler);
        });

        routeNotMatchedChain = routeNotMatchedChain.then(() => {
            if (_.isNumber(History.getState().data.scrollY)) {
                window.scrollTo(0, History.getState().data.scrollY);
            }

            if (!rEvent.isStopped()) {
                // If URL starts with loaded app prefix, go to default route
                if (this.baseUrl !== '/' && url.startsWith(this.baseUrl)) {
                    const defaultRoute = Webiny.Router.getDefaultRoute();
                    if (defaultRoute) {
                        url = defaultRoute.getHref();
                    } else {
                        url = Webiny.Router.getBaseUrl();
                    }
                    History.replaceState({url, replace: true}, null, url);
                    return true;
                }

                // Else reload the page, it is a URL within our domain - but not handled by the current app
                window.location.reload();
            }

            if (rEvent.goTo !== null) {
                return Webiny.Router.goToRoute(rEvent.goTo, rEvent.goToParams);
            }

            return Promise.resolve(true);
        });

        return routeNotMatchedChain;
    }
}

RouterUtils.prototype.baseUrl = null;

export default new RouterUtils();