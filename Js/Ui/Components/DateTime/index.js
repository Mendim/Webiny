import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import Webiny from 'webiny';

class DateTime extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);
        this.valueChanged = false;

        this.bindMethods('setup');
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps['disabledBy']) {
            return true;
        }

        const omit = ['children', 'key', 'ref', 'onChange'];
        const oldProps = _.omit(this.props, omit);
        const newProps = _.omit(nextProps, omit);

        return !_.isEqual(newProps, oldProps) || !_.isEqual(nextState, this.state);
    }

    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate();
        if (prevState.isValid !== this.state.isValid) {
            this.input.setState({
                isValid: this.state.isValid,
                validationMessage: this.state.validationMessage
            });
        }
    }

    setup() {
        const dom = ReactDOM.findDOMNode(this);
        this.element = $(dom.querySelector('input'));

        this.element.datetimepicker({
            format: this.props.inputFormat,
            stepping: this.props.stepping,
            keepOpen: false,
            debug: this.props.debug || false,
            minDate: this.props.minDate ? new Date(this.props.minDate) : false,
            viewMode: this.props.viewMode,
            widgetPositioning: {
                horizontal: this.props.positionHorizontal || 'auto',
                vertical: this.props.positionVertical || 'bottom'
            }
        }).on('dp.hide', e => {
            if (this.valueChanged) {
                this.onChange(e.target.value);
            }
            this.valueChanged = false;
        }).on('dp.change', () => {
            this.valueChanged = true;
        });
    }

    onChange(newValue) {
        if (newValue) {
            const {moment} = this.props;
            newValue = moment(newValue, this.props.inputFormat).format(this.props.modelFormat);
        }

        if (newValue !== this.props.value) {
            this.props.onChange(newValue, this.validate);
        }
    }

    renderPreview() {
        if (!_.isEmpty(this.props.value)) {
            const {moment} = this.props;
            const value = moment(this.props.value, this.props.modelFormat);
            return value.isValid() ? value.format(this.props.inputFormat) : '';
        }

        return this.getPlaceholder();
    }
}

DateTime.defaultProps = _.merge({}, Webiny.Ui.FormComponent.defaultProps, {
    debug: false,
    inputFormat: 'YYYY-MM-DD HH:mm:ss',
    modelFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    positionHorizontal: 'auto',
    positionVertical: 'bottom',
    viewMode: 'days',
    renderer() {
        const omitProps = ['attachToForm', 'attachValidators', 'detachFromForm', 'validateInput', 'form', 'renderer', 'name', 'onChange'];
        const props = _.omit(this.props, omitProps);
        const {Input, Icon} = props;
        props.value = this.renderPreview();
        props.addonRight = <Icon icon="icon-calendar"/>;
        props.onComponentDidMount = input => {
            this.input = input;
            this.setup();
        };

        return <Input {...props}/>;
    }
});

export default Webiny.createComponent(DateTime, {
    modules: ['Icon', 'Input', 'Webiny/Vendors/DateTimePicker', {moment: 'Webiny/Vendors/Moment'}]
});
