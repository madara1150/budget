/** @odoo-module **/

import { NoteEditor } from "../note_editor/note_editor";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart } from "@odoo/owl";

export class RevenueBudgetRenderer extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.state = useState({
      budget_plan: {
        budget_plan_data: [],
      },
      budget_plan_line: {
        budget_plan_line_data: [],
        budget_plan_line_amount: {},
        budget_plan_line_note: {},
      },
      budget_template: {
        budget_template_data: [],
      },
      budget_template_line: {
        budget_template_line_data: [],
        budget_template_merge: [],
      },
      toggle: {
        note: {},
      },
      formated: {
        amount: {},
      },
    });
    onWillStart(async () => {
      await this.fetchData();
      await this.mergeData();
      await this.generateState();
    });
  }

  formattedAmount(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  parseNumber(value) {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, ""), 10) || 0;
  }

  updateNote = async (note, data) => {
    if (!data.plan_line) {
      await this.orm.create("budget.plan.line", [
        {
          plan_id: this.state.budget_plan.budget_plan_data.id,
          note: note,
          template_line_id: data.id,
        },
      ]);
    } else {
      await this.orm.write("budget.plan.line", [data.plan_line.id], {
        note: note,
      });
    }
    await this.fetchData();
    await this.generateState();
  };

  async mergeData() {
    const mergeData =
      this.state.budget_template_line.budget_template_line_data.map(
        (templateLine) => {
          const matchingPlanLine =
            this.state.budget_plan_line.budget_plan_line_data.find(
              (planLine) => planLine.template_line_id[0] === templateLine.id
            );
          return {
            ...templateLine,
            plan_line: matchingPlanLine || null,
          };
        }
      );
    this.state.budget_template_line.budget_template_merge = mergeData;
  }

  async generateState() {
    const data = this.state.budget_template_line.budget_template_merge.map(
      (data) => {
        if (data.plan_line) {
          this.state.budget_plan_line.budget_plan_line_amount[
            `${data.plan_line.id}-${data.id}`
          ] = data.plan_line.amount;
          this.state.formated.amount[`${data.plan_line.id}-${data.id}`] =
            this.formattedAmount(data.plan_line.amount);
          this.state.budget_plan_line.budget_plan_line_note[
            `${data.plan_line.id}-${data.id}`
          ] = data.plan_line.note;
        }
        return data.id;
      }
    );
  }

  async toggleNote(pos) {
    const key = `${pos.id}-${pos.code}`;
    this.state.toggle.note[key] = !this.state.toggle.note[key];
  }

  onBlurSave = async (pos, mode) => {
    if (mode == "create") {
      await this.orm.create("budget.plan.line", [
        {
          plan_id: this.state.budget_plan.budget_plan_data.id,
          template_line_id: pos.id,
          amount: this.parseNumber(
            this.state.formated.amount[`${pos.code}-${pos.id}`]
          ),
        },
      ]);
      this.state.formated.amount[`${pos.code}-${pos.id}`] =
        this.formattedAmount(
          this.state.formated.amount[`${pos.code}-${pos.id}`]
        );
    } else {
      await this.orm.write("budget.plan.line", [pos.plan_line.id], {
        amount: this.parseNumber(
          this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`]
        ),
      });
      this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`] =
        this.formattedAmount(
          this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`]
        );
    }
    await this.fetchData();
    await this.generateState();
  };

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

  async fetchData() {
    const budget_template_id = await this.get_budget_template_id();

    const budget_plan = await this.get_budget_plan(budget_template_id);
    this.state.budget_plan.budget_plan_data = budget_plan;

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
  }
}
RevenueBudgetRenderer.components = { NoteEditor };
RevenueBudgetRenderer.template = "budget_plan_ui.revenue_budget_renderer";
