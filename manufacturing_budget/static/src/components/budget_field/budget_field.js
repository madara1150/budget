/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component, useState, useEffect } from "@odoo/owl";

export class Budget_field extends Component {
  setup() {
    this.state = useState({
      range: this.props.value || "",
      data: [],
    });

    useEffect(
      () => {
        this.updateData();
      },
      () => [this.props.value]
    );
  }

  updateData() {
    const data_props = JSON.parse(this.props.value || "{}");
    const filter_data = data_props.lines
      ? data_props.lines
          .filter((line) => line.code)
          .map((line) => ({
            ...line,
            template_id: data_props.template_id,
            fund_analytic_id: data_props.fund_analytic_id,
            mrp_bom_id: data_props.mrp_bom_id,
          }))
      : [];
    this.state.data.splice(0, this.state.data.length, ...filter_data);
  }
}

Budget_field.template = "manufacturing_budget.Budget_field";
Budget_field.props = {
  ...standardFieldProps,
};

registry.category("fields").add("budget", Budget_field);
