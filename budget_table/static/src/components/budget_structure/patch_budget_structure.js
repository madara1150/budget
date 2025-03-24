/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { BudgetExpenditureReportMain } from "@budget/components/budget_expenditure_report_main/budget_expenditure_report_main";
import { useService } from "@web/core/utils/hooks";

patch(BudgetExpenditureReportMain.prototype, "budget_structure_inherit", {
  setup() {
    this._super.apply(this, arguments);
    this.action = useService("action");
  },

  onChecktest(line_id) {
    if (!this.action) {
      console.error("Action service is not available!");
      return;
    }

    this.action.doAction({
      type: "ir.actions.act_window",
      name: "รายการ",
      target: "current",
      res_id: line_id,
      res_model: "budget.template.line",
      views: [[false, "tree"]],
    });
  },
});
