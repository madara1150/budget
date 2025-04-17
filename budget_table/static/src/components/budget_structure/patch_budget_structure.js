/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { BudgetExpenditureReportMain } from "@budget/components/budget_expenditure_report_main/budget_expenditure_report_main";
import { useService } from "@web/core/utils/hooks";
import { onMounted,useEnv } from "@odoo/owl";

patch(BudgetExpenditureReportMain.prototype, "budget_structure_inherit", {
  setup() {
    this._super.apply(this, arguments);
    this.actionService = useService("action");
    this.orm = useService("orm");
    const env = useEnv();
    console.log("Default Res ID:", env);
  },

  async loadViews() {
    const data = await this.orm.searchRead(
      "ir.ui.view",
      [["name", "=", "budget.appropriation.line.tree.custom"]],
      []
    );
    return data[0].id;
  },

  async onClickBudget(ev) {
    const line_id = ev.currentTarget.dataset.lineId;
    const hasChildren = ev.currentTarget.dataset.hasChildren;
    const hasChildrenArray = hasChildren.split(",").map(Number);

    const view_id = await this.loadViews();
    const action = {
      type: "ir.actions.act_window",
      res_model: "budget.appropriation.line",
      view_mode: "tree,",
      views: [[view_id, "tree"]],
      name: "รายการ",
      target: "new",
      res_id: parseInt(line_id),
      domain: [["template_line_id", "in", hasChildrenArray]],
      context: {
        default_res_id: parseInt(line_id),
      },
    };

    this.actionService.doAction(action);
  },
});
