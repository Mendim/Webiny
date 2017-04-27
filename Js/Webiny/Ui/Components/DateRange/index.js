import Webiny from 'Webiny';
import moment from 'moment';
import 'bootstrap-daterangepicker';
import './styles.scss';

class DateRange extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        _.assign(this.state, {
            date: {
                start: null,
                end: null
            },
            rangeType: _.get(this.props, 'rangeType', '')
        });

        this.options = {
            autoApply: true,
            alwaysShowCalendars: true,
            opens: 'left',
            locale: {
                format: 'DD/MMM/YY'
            },
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        };

        this.availableOptions = [
            'startDate',
            'endDate',
            'minDate',
            'maxDate',
            'dateLimit',
            'showDropdowns',
            'showWeekNumbers',
            'timePicker',
            'timePickerIncrement',
            'timePicker24hour',
            'timePickerSeconds',
            'ranges',
            'opens',
            'drops',
            'buttonClasses',
            'applyClasses',
            'cancelClasses',
            'locale',
            'singleDatePicker',
            'autoApply',
            'linkedCalendars',
            'parentEl',
            'isInvalidDate',
            'autoUpdateInput',
            'alwaysShowCalendars'
        ];

        this.bindMethods('prepare,onChange,setInitialRange');
    }

    componentDidMount() {
        super.componentDidMount();
        // Tricky part: since we are lazy loading dependencies - Input may not yet be available in the DOM so we need to wait for it
        this.interval = setInterval(() => {
            const dom = ReactDOM.findDOMNode(this);
            if (dom && this.getInput()) {
                clearInterval(this.interval);
                this.interval = null;
                this.prepare();
            }
        }, 100);
    }

    componentWillUnmount(props) {
        super.componentWillUnmount(props);
        this.unregisterListeners();
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (!props.value) {
            this.getInput().value = this.getPlaceholder() || '';
        } else {
            const dates = props.value.split(this.props.rangeDelimiter);
            this.element.data('daterangepicker').setStartDate(dates[0]);
            this.element.data('daterangepicker').setEndDate(dates[1]);
        }
    }

    setInitialRange(start, end) {
        const from = moment(start, this.options.locale.format, true);
        const to = moment(end, this.options.locale.format, true);
        if (from.isValid() && to.isValid()) {
            this.options.startDate = start;
            this.options.endDate = end;
        }
    }

    getInput() {
        const dateRangeDom = ReactDOM.findDOMNode(this.refs.daterange);
        return dateRangeDom && dateRangeDom.querySelector('input');
    }

    prepare() {
        this.element = $(this.getInput());

        // detect to which side we need to open the range selector in case opens is set to auto
        let opens = 'left';
        if (this.props.opens === 'auto') {
            let left = this.element.offset().left;
            let windowWidth = window.innerWidth;

            let offset = (left / windowWidth) * 100;

            // if within first 30% of the screen, open to left
            if (offset <= 30) {
                opens = 'right';
            } else if (offset > 30 && offset <= 60) {
                opens = 'center';
            } else {
                opens = 'left';
            }
        }

        const range = _.get(this.options.ranges, _.get(this.props, 'rangeType'));
        _.assign(this.options, this.props.options || {}, _.pick(this.props, this.availableOptions));
        this.options.locale.format = this.props.inputFormat;
        this.options.opens = opens;

        const value = this.getValue();
        if (value) {
            const parts = value.split(this.props.rangeDelimiter);
            this.setInitialRange(parts[0], parts[1]);
        } else if (range) {
            this.setInitialRange(range[0], range[1]);
        }

        this.element.daterangepicker(this.options);
        this.element.on('apply.daterangepicker', (ev, picker) => {
            this.onChange(picker);
        });

        if (!value) {
            this.element[0].value = this.getPlaceholder() || '';
        }

        return this;
    }

    onChange(picker = {}) {
        try {
            if (!this.getInput()) {
                return this;
            }

            const dates = this.getInput().value.split(' - ');
            const from = moment(dates[0], this.props.inputFormat, true);
            const to = moment(dates[1], this.props.inputFormat, true);

            if (from.isValid() && to.isValid()) {
                const fromYmd = from.format(this.props.modelFormat);
                const toYmd = to.format(this.props.modelFormat);
                const state = {
                    date: {
                        range: fromYmd + this.props.rangeDelimiter + toYmd,
                        from: fromYmd,
                        to: toYmd
                    },
                    rangeType: _.get(picker, 'chosenLabel', this.state.rangeType)
                };
                this.setState(state);
                this.props.onChange(state.date.range, this.validate);
            }
        } catch (e) {
            console.log(e);
        }
    }

    unregisterListeners() {
        this.element.off('apply.daterangepicker');
        return this;
    }
}

DateRange.defaultProps = _.merge({}, Webiny.Ui.FormComponent.defaultProps, {
    onChange: _.noop,
    inputFormat: 'YYYY-MM-DD',
    modelFormat: 'YYYY-MM-DD',
    rangeDelimiter: ':',
    rangeType: 'Last 30 Days', // initial date range
    showValidationMessage: true,
    showValidationAnimation: {translateY: 50, opacity: 1, duration: 225},
    hideValidationAnimation: {translateY: 0, opacity: 0, duration: 225},
    opens: 'auto',
    renderer() {
        const {Animate, Input, Icon, FormGroup} = this.props;

        const inputProps = {
            placeholder: this.props.placeholder,
            ref: 'daterange',
            addonRight: <Icon icon="icon-calendar"/>,
            value: this.state.date.range
        };


        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                <div className="picker-holder">
                    <Input {...inputProps}/>
                </div>
                <Animate
                    trigger={this.renderValidationMessage()}
                    show={this.props.showValidationAnimation}
                    hide={this.props.hideValidationAnimation}>
                    {this.renderValidationMessage()}
                </Animate>
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(DateRange, {modules: ['Animate', 'Icon', 'Input', 'FormGroup']});