import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class Data extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.autoRefreshInterval = null; // Ony when 'autoRefresh' prop is used

        this.state = {
            data: null
        };

        this.bindMethods('setData,filter');
        Webiny.Mixins.ApiComponent.extend(this);
    }

    componentWillMount() {
        super.componentWillMount();
        if (!_.isFunction(this.props.children)) {
            console.warn('Warning: Data component only accepts a function as its child element!');
        }
        this.setState({loading: true});
    }

    componentDidMount() {
        super.componentDidMount();
        this.request = this.api.execute().then(apiResponse => {
            this.setData(apiResponse);
            this.props.onInitialLoad(apiResponse);
            return apiResponse.getData();
        });

        if (_.isNumber(this.props.autoRefresh)) {
            this.autoRefreshInterval = setInterval(() => {
                this.request = this.api.execute().then(response => {
                    this.setData(response);
                    return response.getData();
                });
            }, this.props.autoRefresh * 1000)
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.request) {
            this.request.abort();
        }

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    setData(response) {
        if (response.isAborted() || !this.isMounted()) {
            return;
        }

        if (response.isError()) {
            this.setState({loading: false});
            Webiny.Growl.info(response.getError(), 'Could not fetch data', true);
            return;
        }
        this.setState({data: response.getData(), loading: false});
    }

    filter(filters = {}) {
        this.setState({loading: true});
        this.request = this.api.setQuery(filters).execute().then(apiResponse => {
            this.setData(apiResponse);
            this.props.onLoad(apiResponse);
        });
        return this.request;
    }
}

Data.defaultProps = {
    waitForData: true,
    autoRefresh: null,
    onLoad: _.noop,
    onInitialLoad: _.noop,
    renderer() {
        if (this.props.waitForData && !this.state.data) {
            return null;
        }

        const loader = this.state.loading ? <Ui.Loader/> : null;

        return (
            <webiny-data>
                {_.isFunction(this.props.children) ? this.props.children.call(this, this.state.data, this.filter, loader, this) : null}
            </webiny-data>
        );
    }
};

export default Data;