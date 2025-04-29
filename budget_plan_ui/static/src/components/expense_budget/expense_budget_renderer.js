/** @odoo-module **/

import { Component, useState, onWillStart, useEnv } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { CharField } from "@web/views/fields/char/char_field";
import { IntegerField } from "@web/views/fields/integer/integer_field";
import { Budget_table } from "../budget_table/budget_table";

export class ExpenseBudgetRenderer extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.env = useEnv();
    this.env.bus.addEventListener("loading-page", this.loadingToggle);
    this.env.bus.addEventListener("fetch", this.updateData);

    this.state = useState({
      capital: {
        capital_expenditure_list: [],
      },
      budget_template: {
        budget_template_id: 0,
        budget_template_line_data_list: [],
        budget_template_name: "",
        refresh_key: "",
      },
      activity: {
        activity_active_name: "",
        activity_list: [],
        activity_parent_path: [],
        activity_selected_code: "",
        activity_selected_list: [],
      },
      budget_plan: {
        budget_fund: [],
        budget_plan_line_list: [],
        budget_plan_line_id: 0,
        budget_plan_id: 0,
      },
      load: {
        loading: false,
      },
    });

    onWillStart(async () => {
      await this.fetch();
    });
  }

  updateData = async (ev) => {
    await this.fetchBudgetPlanLines();
    await this.fetchBudgetCapital();
    await this.mergeData();
  };

  async onBudgetChange(ev) {
    const selectedId = parseInt(ev.target.value);
    this.env.bus.trigger("budget-type", {
      plan: selectedId,
      budget_plan_id: this.state.budget_plan.budget_plan_id,
    });
  }

  loadingToggle = async (ev) => {
    const data = ev.detail.activity;
    this.state.activity.activity_active_name = data.name;
    this.state.activity.select_activity = data.id;
    const activity_parent_path = data.parent_path
      .split("/")
      .filter((item) => item !== "");
    this.state.activity.activity_parent_path = activity_parent_path;

    const budgetDiv = document.querySelector(".o_select_budget_plan");
    if (budgetDiv) {
      budgetDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    this.state.load.loading = true;
    await this.get_plan("activities");
    setTimeout(async () => {
      this.state.load.loading = false;
      await this.fetch();
    }, 1000);
    await this.fetch();
  };

  async fetchBudgetPlanLines() {
    const budget_plan_line_id = await this.orm.searchRead(
      "budget.plan.line",
      [["plan_id", "=", this.state.budget_plan.budget_plan_id]],
      []
    );
    this.state.budget_plan.budget_plan_line_list = [...budget_plan_line_id];
  }

  async fetchBudgetCapital() {
    const capital_expenditure_id = await this.orm.searchRead(
      "capital.expenditure",
      [],
      []
    );
    this.state.capital.capital_expenditure_list = [...capital_expenditure_id];
  }

  async fetchActivity() {
    const activity_selected = await this.orm.searchRead(
      "account.analytic.account",
      [["id", "=", this.state.activity.activity_parent_path]],
      []
    );
    this.state.activity.activity_selected_code = activity_selected
      .map((item) => item.code)
      .join("");
    this.state.activity.activity_selected_list = activity_selected;
  }

  async mergeData() {
    const mergedData =
      this.state.budget_template.budget_template_line_data_list.map(
        (templateLine) => {
          const matchingPlanLine =
            this.state.budget_plan.budget_plan_line_list.find(
              (planLine) => planLine.template_line_id[0] === templateLine.id
            );

          const matchingCapitalExpenditures =
            this.state.capital.capital_expenditure_list.filter(
              (capital) =>
                matchingPlanLine &&
                capital.budget_plan_line_id[0] === matchingPlanLine.id
            );

          return {
            ...templateLine,
            plan_line: matchingPlanLine || null,
            capital_expenditures:
              matchingCapitalExpenditures.length > 0
                ? matchingCapitalExpenditures
                : null,
            plan_id: this.state.budget_plan.budget_plan_id,
          };
        }
      );

    const finalData = mergedData.map((item) => ({
      ...item,
      can_edit: item.has_children.length === 0,
      root_parent: item.parent_id
        ? parseInt(item.parent_path.split("/")[0])
        : item.id,
    }));
    this.state.budget_template.budget_template_line_data_list = JSON.parse(
      JSON.stringify(finalData)
    );
    this.state.budget_template.refresh_key = Date.now();
  }

  async get_budget_template_id() {
    const budget_template_id = await this.orm.call("budget.plan", "get_id", []);
    return budget_template_id;
  }

  async get_structure_template_by_id(template_id) {
    const get_structure_template = await this.orm.call(
      "report.budget.budget_template_structure",
      "get_html",
      [template_id]
    );
    return get_structure_template;
  }

  async get_plan(type = "funds", fields = []) {
    try {
      const plan_id = await this.orm.searchRead(
        "account.analytic.plan",
        [["code", "=", type]],
        fields
      );
      const plan_data = await this.orm.searchRead(
        "account.analytic.account",
        [["plan_id", "=", plan_id[0].id]],
        fields
      );
      return plan_data;
    } catch (error) {
      console.warn(error);
    }
  }

  async get_budget_plan(template_id) {
    const budget_plan_id = await this.orm.searchRead(
      "budget.plan",
      [["template_id", "=", template_id]],
      []
    );
    return budget_plan_id[0];
  }

  async fetch() {
    this.state.budget_template.budget_template_id =
      await this.get_budget_template_id();

    this.state.activity.activity_list = await this.get_plan("activities");
    this.state.budget_plan.budget_fund = await this.get_plan();

    const structure_template = await this.get_structure_template_by_id(
      this.state.budget_template.budget_template_id
    );

    this.state.budget_template.budget_template_name =
      structure_template["budget_template"].name;
    this.state.budget_template.budget_template_line_data_list =
      structure_template["lines"];

    const budget_plan = await this.get_budget_plan(
      this.state.budget_template.budget_template_id
    );
    this.state.budget_plan.budget_plan_id = budget_plan.id;

    await this.fetchBudgetPlanLines();
    await this.fetchBudgetCapital();
    await this.mergeData();
  }
}

ExpenseBudgetRenderer.components = {
  CharField,
  IntegerField,
  Budget_table,
};

ExpenseBudgetRenderer.template = "budget_plan_ui.expense_budget_renderer";
