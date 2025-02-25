/** @odoo-module **/

import { Component } from "@odoo/owl";
import { ControlPanel } from "@web/search/control_panel/control_panel";

export class Budget_control_panel extends Component {

    setup() {
        this.controlPanelDisplay = {
            "top-right": false,
            "bottom-right": false,
        };
        this.env.config.viewSwitcherEntries = [];
    }
}

Budget_control_panel.template = "budget.budget_control_panel";
Budget_control_panel.components = { ControlPanel }
