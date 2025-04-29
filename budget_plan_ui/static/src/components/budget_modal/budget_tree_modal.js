/** @odoo-module **/

import { Component, useEnv, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class Budget_tree_modal extends Component {
  setup() {
    this.state = useState({
      budget_plan: {
        budget_plan_line_modal: [],
        plan: 0,
        budget_plan_id: 0,
        budget_plan_line_id: 0,
      },
      budget_template: {
        budget_template_line_id: 0,
      },
      capital: {},
      modalMode: "create",
    });
    this.orm = useService("orm");
    this.env = useEnv();
    this.env.bus.addEventListener("capital", this.getCapital);
    this.env.bus.addEventListener("modal", this.onModalEvent);
    this.env.bus.addEventListener("budget-type", this.onChangePlan);
  }

  getCapital = async (ev) => {
    const capital = ev.detail.capital;
    this.state.budget_template.budget_template_line_id = capital.id;
    if (capital.plan_line) {
      this.state.budget_plan.budget_plan_line_modal =
        capital.capital_expenditures;
      this.state.budget_plan.budget_plan_line_id = capital.plan_line.id;
    } else {
      this.state.budget_plan.budget_plan_line_modal = [];
      this.state.budget_plan.budget_plan_line_id = 0;
    }
  };

  onChangePlan = async (ev) => {
    const data = ev.detail;
    this.state.budget_plan.plan = data.plan;
    this.state.budget_plan.budget_plan_id = data.budget_plan_id;
  };

  refresh() {
    this.env.bus.trigger("fetch", {});
  }

  sendEvent() {
    this.env.bus.trigger("modal_event", {
      capital: this.state.capital,
      mode: this.state.modalMode,
    });
  }

  async openModal(mode, capital = null) {
    this.state.modalMode = mode;
    if (mode === "edit" && capital) {
      this.state.capital = {
        ...capital,
        capital_id: capital.id,
        payment_plan: "single",
      };
    } else {
      this.state.capital = {
        name: "",
        expected_purchase_date: "",
        note: "",
        payment_plan: "single",
        amount: 0,
      };
    }
    this.sendEvent();
    $("#capital_modal").modal("show");
  }

  onModalEvent = async (ev) => {
    const detail = ev.detail;
    this.state.capital.capital_id = detail.capital.capital_id;
    this.state.capital.name = detail.capital.name;
    this.state.capital.expected_purchase_date =
      detail.capital.expected_purchase_date;
    this.state.capital.payment_plan = detail.capital.payment_plan;
    this.state.capital.note = detail.capital.note;
    this.state.capital.amount = detail.capital.amount;
    if (this.state.modalMode == "edit") {
      await this.editCapital();
    } else {
      await this.saveCapital();
    }
    this.refresh();
  };

  async saveCapital() {
    if (this.__owl__.isDestroyed) return;
    try {
      if (this.state.budget_plan.budget_plan_line_id !== 0) {
        await this.orm.create("capital.expenditure", [
          {
            name: this.state.capital.name,
            expected_purchase_date:
              this.state.capital.expected_purchase_date || null,
            amount: this.state.capital.amount,
            note: this.state.capital.note,
            budget_plan_line_id: this.state.budget_plan.budget_plan_line_id,
            payment: "single",
          },
        ]);
      } else {
        const budget_plan_line_id_create = await this.orm.create(
          "budget.plan.line",
          [
            {
              plan_id: this.state.budget_plan.budget_plan_id,
              template_line_id:
                this.state.budget_template.budget_template_line_id,
              amount: 0,
            },
          ]
        );

        if (this.__owl__.isDestroyed) return;
        await this.orm.create("capital.expenditure", [
          {
            name: this.state.capital.name,
            expected_purchase_date:
              this.state.capital.expected_purchase_date || null,
            amount: this.state.capital.amount,
            note: this.state.capital.note,
            budget_plan_line_id: budget_plan_line_id_create,
            payment: "single",
          },
        ]);
      }
      if (this.__owl__.isDestroyed) return;
      $("#capital_tree").modal("hide");
      this.refresh();
    } catch (error) {
      console.error("Component Error", error);
    }
  }

  async editCapital() {
    try {
      if (this.__owl__.isDestroyed) return;

      await this.orm.write(
        "capital.expenditure",
        [this.state.capital.capital_id],
        {
          name: this.state.capital.name,
          expected_purchase_date: this.state.capital.expected_purchase_date,
          amount: this.state.capital.amount,
          note: this.state.capital.note,
        }
      );

      if (this.__owl__.isDestroyed) return;

      $("#capital_tree").modal("hide");
      this.refresh();
    } catch (error) {
      console.error("component Error", error);
    }
  }

  async deleteCapital(capital) {
    try {
      if (this.__owl__.isDestroyed) return;

      await this.orm.unlink("capital.expenditure", [capital.id]);

      if (this.__owl__.isDestroyed) return;

      this.refresh();
    } catch (error) {
      console.error("component Error", error);
    }
  }
}

Budget_tree_modal.template = "budget_plan_ui.Budget_tree_modal";
