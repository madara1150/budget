/** @odoo-module **/

  import { Component, useState, useEnv } from "@odoo/owl";
  import { useService } from "@web/core/utils/hooks";

  export class Create_edit_modal extends Component {
      setup() {
        this.orm = useService("orm");
        this.env = useEnv();
        this.env.bus.addEventListener("modal_event", this.onModalEvent);
        this.state = useState({
          modalMode: "create",
          capital: {
            capital_id: 0,
            name: "",
            expected_purchase_date: "",
            payment_plan: "single",
            note: "",
            amount: 0,
          },
        })
      }
  onModalEvent = (ev) => {
    const detail = ev.detail
    this.state.capital.capital_id = detail.capital.capital_id
    this.state.capital.name = detail.capital.name
    this.state.capital.expected_purchase_date = detail.capital.expected_purchase_date
    this.state.capital.payment_plan = detail.capital.payment_plan
    this.state.capital.note = detail.capital.note
    this.state.capital.amount = detail.capital.amount
    this.state.modalMode = detail.mode
  }

  sendEvent = () => {
      this.env.bus.trigger("modal_event", { capital: this.state.capital, mode: this.state.modalMode });
  }

  }

  Create_edit_modal.template = "budget_plan_ui.Create_edit_modal"

  