import Webiny from 'Webiny';
import Validator from './../Validation/Validator';

class Form extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            model: {}
        };

        this.$isValid = null;
        this.fields = [];
        this.actions = [];
        this.layout = null;

        this.bindMethods('submit', 'reset', 'cancel', 'attachToForm', 'attachValidators', 'detachFromForm', 'validateInput', 'validateForm');
    }

    componentWillMount() {
        super.componentWillMount();
        this.inputs = {};
        this.setState({model: _.clone(this.props.data)});
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setState({model: _.clone(props.data)});
    }

    componentWillUpdate(newProps, newState) {
        super.componentWillUpdate(newProps, newState);
    }

    bindTo(name) {
        return super.bindTo('model.' + name);
    }

    /**
     * @private
     * @param children
     */
    prepareForm(children) {
        if (typeof children !== 'object' || children === null) {
            return;
        }

        React.Children.map(children, child => {
            if (child.type === 'fields') {
                this.fields = this.registerInputs(child.props.children);
            }

            if (child.type === 'actions') {
                this.actions = child.props.children;
            }

            if (child.type === 'layout') {
                this.layout = child.props.children;
            }
        }, this);

        if (this.props.layout === false) {
            this.layout = (
                <layout>
                    <fields/>
                </layout>
            );
        }

        if (this.props.layout) {
            this.layout = this.props.layout.bind(this)();
        }
    }

    /**
     * @private
     * @param element
     * @returns {*}
     */
    replacePlaceholders(element) {
        if (typeof element !== 'object' || element === null) {
            return element;
        }

        if (element.type === 'fields') {
            return this.fields;
        }

        if (element.type === 'actions') {
            return this.actions;
        }

        if (element.props && element.props.children) {
            return React.cloneElement(element, element.props, React.Children.map(element.props.children, item => {
                return this.replacePlaceholders(item);
            }));
        }

        return element;
    }

    /**
     * @private
     * @param input
     * @returns {*}
     */
    registerInput(input) {
        if (typeof input !== 'object' || input === null) {
            return input;
        }

        const newProps = {
            attachToForm: this.attachToForm,
            attachValidators: this.attachValidators,
            detachFromForm: this.detachFromForm,
            validateInput: this.validateInput,
            form: this
        };

        if (input.props && input.props.name) {
            newProps['valueLink'] = this.bindTo(input.props.name);
            return React.cloneElement(input, newProps, input.props && input.props.children);
        }
        return React.cloneElement(input, input.props, this.registerInputs(input.props && input.props.children));
    }

    /**
     * @private
     * @param children
     * @returns {*}
     */
    registerInputs(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }
        return React.Children.map(children, this.registerInput, this);
    }

    /**
     * Get data this form is responsible for.
     * Form may receive data through props that is not handled by any of form input elements, so we only return relevant data.
     * @returns {{}}
     */
    getData() {
        const model = {};
        _.each(this.inputs, (input, name) => {
            _.set(model, name, _.get(this.state.model, name));
        });

        return model;
    }

    getLinkedForms() {
        return _.filter(this.props.linkedForms.split(',')).map(Webiny.Ui.Dispatcher.get);
    }

    submit(e) {
        e.preventDefault();
        const mainFormValid = this.validateForm();

        if (!mainFormValid) {
            return this.props.onInvalid(this);
        }
        const model = this.getData();
        // Validate linked forms
        if (this.props.linkedForms) {
            let valid = true;
            const forms = this.getLinkedForms();
            _.each(forms, form => {
                if (!form.validateForm()) {
                    if (valid) {
                        form.props.onInvalid(form);
                    }
                    valid = false;
                }
            });

            if (!valid) {
                return false;
            }

            _.each(forms, form => {
                _.merge(model, form.getData());
            });
        }

        this.props.onSubmit(model, this);
    }

    reset() {
        // Reset all linked forms
        _.each(this.getLinkedForms(), form => form.reset());

        _.forIn(this.inputs, cmp => {
            cmp.component.setState({isValid: null});
        });
        this.$isValid = null;

        this.props.onReset();

        this.setState({model: _.clone(this.props.data)});
    }

    cancel() {
        this.props.onCancel();
    }

    isValid() {
        return this.$isValid;
    }

    attachValidators(props) {
        this.inputs[props.name].validators = Validator.parseValidateProperty(props.validate);
        this.inputs[props.name].messages = Validator.parseCustomValidationMessages(props.children);
    }

    attachToForm(component) {
        this.inputs[component.props.name] = {
            component,
            model: component.getValue()
        };
        this.attachValidators(component.props);
    }

    detachFromForm(component) {
        delete this.inputs[component.props.name];
    }

    validateInput(component) {
        const validators = this.inputs[component.props.name].validators;
        const hasValidators = Webiny.Tools.keys(validators).length;
        const messages = this.inputs[component.props.name].messages;
        // Validate input
        return Q(Validator.validate(component.getValue(), validators, this.inputs)).then(() => {
            if (hasValidators) {
                const isValid = component.getValue() === null ? null : true;
                component.setState({isValid});
            }
            return component.getValue();
        }).catch(validationError => {
            // Set custom error message if defined
            const validator = validationError.validator;
            if (validator in messages) {
                validationError.setMessage(messages[validator]);
            }

            // Set component state to reflect validation error
            component.setState({
                isValid: false,
                validationMessage: validationError.message
            });

            return null;
        });
    }

    validateForm() {
        let allIsValid = true;

        const inputs = this.inputs;
        Object.keys(inputs).forEach(name => {
            const cmp = inputs[name].component;
            const hasValidators = inputs[name] && inputs[name].validators;
            const shouldValidate = (!cmp.hasValue() && cmp.isRequired()) || (cmp.hasValue() && cmp.state.isValid === false);

            if (hasValidators && shouldValidate) {
                if (cmp.state.isValid === false || cmp.state.isValid === null) {
                    this.validateInput(cmp);
                    allIsValid = false;
                }
            }
        });

        return allIsValid;
    }

    render() {
        this.prepareForm(this.props.children);
        return super.render();
    }
}

Form.defaultProps = {
    name: _.uniqueId('form-'),
    onSubmit: _.noop,
    onReset: _.noop,
    onCancel: _.noop,
    onInvalid: _.noop,
    showLoader: true,
    linkedForms: ''
};

export default Form;