import React from 'react';
import _ from 'lodash';
import Webiny from 'webiny';

class DateField extends Webiny.Ui.Component {

}

DateField.defaultProps = {
    default: '-',
    format: 'YYYY-MM-DD',
    renderer() {
        const {List, moment, format, ...props} = this.props;
        const date = moment(_.get(this.props.data, this.props.name));

        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => date.isValid() ? date.format(format) : this.props.default}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(DateField, {modules: ['List', {moment: 'Webiny/Vendors/Moment'}], tableField: true});