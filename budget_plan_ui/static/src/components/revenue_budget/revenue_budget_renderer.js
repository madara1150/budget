/** @odoo-module **/

import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart, useEnv, onMounted } from "@odoo/owl";
import { Budget_table } from "../budget_table/budget_table";

export class RevenueBudgetRenderer extends Component {
  setup() {
    this.orm = useService("orm");
    this.env = useEnv();
    this.state = useState({
      budget_plan: {
        budget_plan_data: [],
        budget_plan_id: 0,
      },
      budget_plan_line: {
        budget_plan_line_data: [],
      },
      budget_template: {
        budget_template_data: [],
      },
      budget_template_line: {
        budget_template_line_data: [],
        budget_template_merge: [],
        refresh_key: "",
      },
    });
    onWillStart(async () => {
      await this.fetchData();
      await this.mergeData();
    });
    this.env.bus.addEventListener("fetch", this.updateData);
  }

  updateData = async (ev) => {
    await this.fetchData();
    await this.mergeData();
    await this.fetchPlanLine();
  };

  async mergeData() {
    const mergeData =
      this.state.budget_template_line.budget_template_line_data.map(
        (templateLine) => {
          const matchingPlanLine =
            this.state.budget_plan_line.budget_plan_line_data.find(
              (planLine) => {
                return (
                  (planLine.template_line_id?.[0] ||
                    planLine.template_line_id) === templateLine.id
                );
              }
            );

          return {
            ...templateLine,
            plan_line: matchingPlanLine || null,
            plan_id: this.state.budget_plan.budget_plan_id,
          };
        }
      );
    this.state.budget_template_line.budget_template_merge = JSON.parse(
      JSON.stringify(mergeData)
    );
    this.state.budget_template_line.refresh_key = Date.now();
  }

  async get_budget_template_id() {
    return await this.orm.call("budget.plan", "get_id", []);
  }

  async get_budget_plan(template_id) {
    const budget_plan = await this.orm.searchRead(
      "budget.plan",
      [["template_id", "=", template_id]],
      []
    );
    return budget_plan[0];
  }

  async get_budget_plan_line(plan_id) {
    if (this.__owl__.isDestroyed) return null;
    const budget_plan_line = await this.orm.searchRead(
      "budget.plan.line",
      [["plan_id", "=", plan_id]],
      []
    );
    return budget_plan_line;
  }

  async get_structure_template(template_id, type) {
    const get_structure_template_line = await this.orm.call(
      "report.budget.budget_template_structure",
      "get_html",
      [template_id]
    );
    return get_structure_template_line[type];
  }

  async fetchPlanLine() {
    await this.get_budget_plan_line(this.state.budget_plan.budget_plan_id);
  }

  async fetchData() {
    try {
      const budget_template_id = await this.get_budget_template_id();

      const budget_plan = await this.get_budget_plan(budget_template_id);
      this.state.budget_plan.budget_plan_data = budget_plan;
      this.state.budget_plan.budget_plan_id = budget_plan.id;

      const budget_plan_line = await this.get_budget_plan_line(budget_plan.id);
      this.state.budget_plan_line.budget_plan_line_data = budget_plan_line;

      const structure_template_line = await this.get_structure_template(
        budget_template_id,
        "budget_template"
      );

      this.state.budget_template.budget_template_data = structure_template_line;
      const budget_template_line_can_edit = await this.get_structure_template(
        budget_template_id,
        "lines"
      );

      this.state.budget_template_line.budget_template_line_data =
        budget_template_line_can_edit.map((item) => ({
          ...item,
          can_edit: item.has_children.length === 0,
        }));

      await this.mergeData();
    } catch (error) {
      console.warn(error);
    }
  }
}
RevenueBudgetRenderer.components = { Budget_table };
RevenueBudgetRenderer.template = "budget_plan_ui.revenue_budget_renderer";
