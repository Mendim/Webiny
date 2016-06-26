import Webiny from 'Webiny';

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

        this.bindMethods('prepare,onChange');
    }

    componentDidMount() {
        super.componentDidMount();
        this.prepare();
    }

    componentWillUnmount(props) {
        super.componentWillUnmount(props);
        this.unregisterListeners();
    }

    prepare() {
        this.element = $(this.refs.daterange);

        const range = _.get(this.options.ranges, _.get(this.props, 'rangeType'));
        _.assign(this.options, this.props.options || {}, _.pick(this.props, this.availableOptions));
        this.options.locale.format = this.props.inputFormat;

        const setInitialRange = (start, end) => {
            const from = moment(start, this.options.locale.format, true);
            const to = moment(end, this.options.locale.format, true);
            if (from.isValid() && to.isValid()) {
                this.options.startDate = start;
                this.options.endDate = end;
            }
        };

        if (this.props.valueLink.value) {
            const parts = this.props.valueLink.value.split(this.props.rangeDelimiter);
            setInitialRange(parts[0], parts[1]);
        } else if (range) {
            setInitialRange(range[0], range[1]);
        }


        this.element.daterangepicker(this.options);
        this.element.on('apply.daterangepicker', (ev, picker) => {
            this.onChange(picker);
        });

        return this;
    }

    onChange(picker = {}) {
        try {
            if (!this.refs.daterange) {
                return this;
            }

            const dates = this.refs.daterange.value.split(' - ');
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
                if (this.props.valueLink) {
                    this.props.valueLink.requestChange(state.date.range);
                } else {
                    this.props.onChange(state.date.range);
                }
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

DateRange.defaultProps = {
    onChange: _.noop,
    inputFormat: 'YYYY-MM-DD',
    modelFormat: 'YYYY-MM-DD',
    rangeDelimiter: ':',
    rangeType: 'Last 30 Days', // initial date range
    renderer() {
        let label = null;
        if (this.props.label) {
            label = <label className="control-label">{this.props.label}</label>;
        }

        return (
            <div className="form-group">
                {label}
                <div className="picker-holder">
                    <input type="text" ref="daterange" className="form-control pavel" data-toggle="dropdown"/>
                    <span className="icon-calendar icon_c"></span>
                </div>
            </div>
        );
    }
};

export default DateRange;