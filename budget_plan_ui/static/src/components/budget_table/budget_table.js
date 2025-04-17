/** @odoo-module **/

import { Component, useState, useEnv, onWillStart } from "@odoo/owl";
import { NoteEditor } from "../note_editor/note_editor";
import { useService } from "@web/core/utils/hooks";
import { Create_edit_modal } from "../create_edit_modal/create_edit_modal";
import { Budget_modal } from "../budget_modal/budget_modal";

export class Budget_table extends Component {
  setup() {
    this.state = useState({
      rotated: {},
      activity: {
        select_activity: 0,
      },
      budget_plan: {
        plan: 0,
        budget_plan_id: 0,
      },
      budget_plan_line: {
        amount: {},
        note: {},
      },
      formated: {
        amount: {},
      },
    });
    this.orm = useService("orm");
    this.env = useEnv();
    this.env.bus.addEventListener("budget-type", this.onChangePlan);
    console.log(this.props.data)

    onWillStart(async () => {
      await this.generateState();
    });
  }

  async generateState() {
    this.props.data.map((data) => {
      if (data.plan_line) {
        this.state.budget_plan_line.amount[`${data.plan_line.id}-${data.id}`] =
          data.plan_line.amount;
        this.state.formated.amount[`${data.plan_line.id}-${data.id}`] =
          this.formattedAmount(data.plan_line.amount);
        this.state.budget_plan_line.note[`${data.plan_line.id}-${data.id}`] =
          data.plan_line.note;
      }

      return data.id;
    });
  }

  async modalCapital(template) {
    this.env.bus.trigger("capital", { capital: template });
  }

  onChangePlan = async (ev) => {
    const data = ev.detail;
    this.state.budget_plan.plan = data.plan;
    this.state.budget_plan.budget_plan_id = data.budget_plan_id;
  };

  formattedAmount(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  parseNumber(value) {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, ""), 10) || 0;
  }

  async toggleRotate(key) {
    this.state.rotated[key] = !this.state.rotated[key];
  }

  loadingToggle = async (activity) => {
    this.state.activity.select_activity = activity.id;
    this.env.bus.trigger("loading-page", { activity: activity });
  };

  updateNote = async (note, data) => {
    if (!data.plan_line) {
      await this.orm.create("budget.plan.line", [
        {
          plan_id: data.plan_id,
          note: note,
          template_line_id: data.id,
        },
      ]);
    } else {
      await this.orm.write("budget.plan.line", [data.plan_line.id], {
        note: note,
      });
    }
    this.env.bus.trigger("fetch", {});
  };

  onBlurSave = async (template, mode) => {
    if (mode == "create") {
      await this.orm.create("budget.plan.line", [
        {
          plan_id: template.plan_id,
          activity_analytic_id: this.state.activity.select_activity,
          fund_analytic_id: "",
          template_line_id: template.id,
          amount: this.parseNumber(
            this.state.formated.amount[`${template.code}-${template.id}`]
          ),
        },
      ]);
      this.state.formated.amount[`${template.code}-${template.id}`] =
        this.formattedAmount(
          this.state.formated.amount[`${template.code}-${template.id}`]
        );
    } else {
      await this.orm.write("budget.plan.line", [template.plan_line.id], {
        amount: this.parseNumber(
          this.state.formated.amount[`${template.plan_line.id}-${template.id}`]
        ),
      });
      await this.generateState();
      this.state.formated.amount[`${template.plan_line.id}-${template.id}`] =
        this.formattedAmount(
          this.state.formated.amount[`${template.plan_line.id}-${template.id}`]
        );
    }
  };
}

Budget_table.props = {
  data: { type: Object },
  isShow: { type: Boolean, optional: true },
  type: { type: String },
};

Budget_table.components = {
  NoteEditor,
  Create_edit_modal,
  Budget_modal,
};

Budget_table.template = "budget_plan_ui.Budget_table";
