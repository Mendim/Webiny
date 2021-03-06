import React from 'react';
import _ from 'lodash';
import Webiny from 'webiny';

class UserRoles extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            roles: []
        };

        this.bindMethods('onChange');
    }

    componentWillMount() {
        super.componentWillMount();
        new Webiny.Api.Endpoint(this.props.api).get('/', {_perPage: 1000, _sort: 'name'}).then(apiResponse => {
            if (this.isMounted()) {
                this.setState({roles: _.filter(apiResponse.getData('list'), r => r.slug !== 'public')});
            }
        });
    }

    onChange(index, role, enabled) {
        const value = this.props.value || [];
        if (enabled) {
            value.push(role);
        } else {
            value.splice(index, 1);
        }
        this.props.onChange(value);
    }
}

UserRoles.defaultProps = {
    api: '/entities/webiny/user-roles',
    value: [],
    onChange: _.noop,
    renderer() {
        const {List, Switch, Link} = this.props;
        return (
            <List.Table data={this.state.roles}>
                <List.Table.Row>
                    <List.Table.Field style={{width: 140}} align="center">
                        {(role) => {
                            const checkedIndex = _.findIndex(this.props.value, {id: role.id});
                            return (
                                <Switch value={checkedIndex > -1} onChange={enabled => this.onChange(checkedIndex, role, enabled)}/>
                            );
                        }}
                    </List.Table.Field>
                    <List.Table.Field label="Role">
                        {(role) => (
                            <span>
                                <Link route="UserRoles.Edit" params={{id: role.id}}><strong>{role.name}</strong></Link><br/>{role.slug}
                            </span>
                        )}
                    </List.Table.Field>
                    <List.Table.Field label="Description" name="description"/>
                </List.Table.Row>
            </List.Table>
        );
    }
};

export default Webiny.createComponent(UserRoles, {modules: ['List', 'Switch', 'Link']});