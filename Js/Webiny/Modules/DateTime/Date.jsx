import BaseDateTime from './Base';

class Date extends BaseDateTime {

    setValue(newValue) {
        if (!_.isEmpty(newValue)) {
            newValue = moment(newValue, this.props.modelFormat);
            newValue = newValue.isValid() ? newValue.format(this.props.inputFormat) : '';
        } else {
            newValue = this.props.placeholder;
        }

        super.setValue(newValue);
    }

    onChange(e) {
        let newValue = e.target.value;
        if (newValue) {
            const format = this.props.withTimezone ? 'YYYY-MM-DDTHH:mm:ssZ' : this.props.modelFormat;
            newValue = moment(newValue, this.props.inputFormat).format(format);
        }

        if (newValue !== this.props.valueLink.value) {
            this.props.valueLink.requestChange(newValue, this.validate);
        }
    }
}

Date.defaultProps = _.merge({}, BaseDateTime.defaultProps, {
    disabled: false,
    readOnly: false,
    placeholder: null,
    inputFormat: 'YYYY-MM-DD',
    modelFormat: 'YYYY-MM-DD',
    viewMode: 'days',
    withTimezone: false
});

export default Date;
