/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component, useState, onWillUpdateProps } from "@odoo/owl";

export class Budget_field extends Component {
    setup() {
        this.state = useState({
            range: this.props.value || '',
        });
    }
}

Budget_field.template = "manufacturing_budget.Budget_field";
Budget_field.props = {
    ...standardFieldProps,
};

Budget_field.supportedTypes = ["char"];

registry.category("fields").add("budget", Budget_field);