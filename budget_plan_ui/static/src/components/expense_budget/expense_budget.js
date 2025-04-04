/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart, useEnv } from "@odoo/owl";
import { Budget_control_panel } from "../budget_control_panel/budget_control_panel";
import { NoteEditor } from "../note_editor/note_editor";
import { CharField } from "@web/views/fields/char/char_field";
import { IntegerField } from "@web/views/fields/integer/integer_field";
import { Create_edit_modal } from "../create_edit_modal/create_edit_modal";

export class Expense_budget extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.env = useEnv();
    this.env.bus.addEventListener("modal_click", this.onModalEvent);
    this.state = useState({
      activity: {
        activity_active_name: "",
        activity_list: [],
        select_activity: 0,
        activity_parent_path:[],
        activity_selected_code:"",
        activity_selected_list: []
      },
      load: {
        loading: false,
      },
      capital: {
        capital_expenditure_list: [],
        capital_id: 0,
        name: "",
        expected_purchase_date: "",
        payment_plan: "single",
        options: [
          ["single", "Monthly Payment"],
          ["quarterly", "Quarterly Payment"],
          ["yearly", "Yearly Payment"],
        ],
        note: "",
        amount: 0,
      },
      modalMode: "create",
      budget_template: {
        budget_template_id: 0,
        budget_template_line_list: [],
        budget_template_line_data_list: [],
        budget_template_name: "",
        budget_template_line_id: 0,
      },
      budget_plan_line: {
        budget_salary_amount: {},
        budget_salary_note: {},
      },
      rotated: {},
      budget_plan: {
        budget_fund: [],
        budget_activity: [],
        budget_plan_line_list: [],
        budget_plan_line_modal: [],
        budget_plan_line_id: 0,
        budget_plan: 0,
        plan_name: "",
        budget_plan_id: 0,
      },
      fund: "",
      formated: {
        amount: {},
      },
    });

    onWillStart(async () => {
      await this.fetchData();
      await this.generateState();
    });
  }

  onWillUnmount() {
    this.env.bus.removeEventListener("modal_click", this.onCustomEvent);
}

  formattedAmount(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  parseNumber(value) {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, ""), 10) || 0;
  }

  sendEvent() {
    this.env.bus.trigger("modal_event", {
      capital: this.state.capital,
      mode: this.state.modalMode,
    });
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
      await this.saveEditCapital();
    } else {
      await this.saveCapital();
    }
  };

  onWillUnmount() {
    this.env.bus.removeEventListener("modal_event", this.onModalEvent);
  }

  onAmountChange = (template, val) => {
    this.state.budget_plan_line.budget_salary_amount[
      `${template.plan_line.id}-${template.id}`
    ] = val;
  };

  // งบลงทุน กดเพิ่มเพื่อเพิ่มข้อมูล
  async modalCapital(capital) {
    this.state.budget_template.budget_template_line_id = capital.id;
    if (capital.plan_line) {
      this.state.budget_plan.budget_plan_line_modal =
        capital.capital_expenditures;
      this.state.budget_plan.budget_plan_line_id = capital.plan_line.id;
    } else {
      this.state.budget_plan.budget_plan_line_modal = [];
      this.state.budget_plan.budget_plan_line_id = 0;
    }
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

  // สร้าง capital ใหม่
  async saveCapital() {
    if (this.state.budget_plan.budget_plan_line_id) {
      const data = await this.orm.create("capital.expenditure", [
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
      const data = await this.orm.create("budget.plan.line", [
        {
          plan_id: this.state.budget_plan.budget_plan_id,
          template_line_id: this.state.budget_template.budget_template_line_id,
          amount: 0,
        },
      ]);
      await this.orm.create("capital.expenditure", [
        {
          name: this.state.capital.name,
          expected_purchase_date:
            this.state.capital.expected_purchase_date || null,
          amount: this.state.capital.amount,
          note: this.state.capital.note,
          budget_plan_line_id: data,
          payment: "single",
        },
      ]);
    }
    $("#capital_tree").modal("hide");
    await this.fetchBudgetCapital();
    await this.fetchBudgetPlanLines();
    await this.mergeData();
    await this.generateState();
  }

  // บันทึกการแก้ไข Capital
  async saveEditCapital() {
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
    $("#capital_tree").modal("hide");
    await this.fetchBudgetCapital();
    await this.fetchBudgetPlanLines();
    await this.mergeData();
    await this.generateState();
  }

  async deleteCapital(capital) {
    await this.orm.unlink("capital.expenditure", [capital.id]);
    await this.fetchBudgetPlanLines();
    await this.fetchBudgetCapital()
    await this.mergeData();
    await this.generateState();
  }

  // กลับหัวลูกสร
  async toggleRotate(key) {
    this.state.rotated[key] = !this.state.rotated[key];
  }

  // ทำหน้าแสดง loading
  loadingToggle = async (name, activity) => {
    this.state.activity.activity_active_name = name;
    this.state.activity.select_activity = activity.id;
    const activity_parent_path = activity.parent_path.split("/").filter(item => item !== "")
    this.state.activity.activity_parent_path = activity_parent_path

    // เลื่อนหน้า
    const budgetDiv = document.querySelector(".o_select_budget_plan");
        if (budgetDiv) {
            budgetDiv.scrollIntoView({ behavior: "smooth", block: "end" });
        }

    this.state.load.loading = true;
    await this.fetchActivity()
    setTimeout(async () => {
      this.state.load.loading = false;
      await this.fetchData();
    }, 1000);
    await this.fetchData();
  };

  // reset ค่า state ให้แสดง
  async generateState() {
    const data = this.state.budget_template.budget_template_line_data_list.map(
      (data) => {
        if (data.plan_line) {
          this.state.budget_plan_line.budget_salary_amount[
            `${data.plan_line.id}-${data.id}`
          ] = data.plan_line.amount;
          this.state.formated.amount[`${data.plan_line.id}-${data.id}`] =
            this.formattedAmount(data.plan_line.amount);
          this.state.budget_plan_line.budget_salary_note[
            `${data.plan_line.id}-${data.id}`
          ] = data.plan_line.note;
        }

        return data.id;
      }
    );
  }

  // ปุ่มบันทึก save Note
  updateNote = async (note, data) => {
    if (!data.plan_line) {
      await this.orm.create("budget.plan.line", [
        {
          plan_id: this.state.budget_plan.budget_plan_id,
          note: note,
          template_line_id: data.id,
        },
      ]);
    } else {
      await this.orm.write("budget.plan.line", [data.plan_line.id], {
        note: note,
      });
    }
    await this.fetchBudgetPlanLines();
    await this.mergeData();
    await this.generateState();
  };

  // fetch budget plan
  async fetchBudgetPlanLines() {
    const budget_plan_line_id = await this.orm.searchRead(
      "budget.plan.line",
      [["plan_id", "=", this.state.budget_plan.budget_plan_id]],
      []
    );
    this.state.budget_plan.budget_plan_line_list = [...budget_plan_line_id];
  }
  //fetch budget capital
  async fetchBudgetCapital() {
    const capital_expenditure_id = await this.orm.searchRead(
      "capital.expenditure",
      [],
      []
    );
    this.state.capital.capital_expenditure_list = [...capital_expenditure_id];
  }
  //fetch activity
  async fetchActivity() {
    const activity_selected = await this.orm.searchRead(
      "account.analytic.account",
      [["id", "=", this.state.activity.activity_parent_path]],
      []
    );
    this.state.activity.activity_selected_code = activity_selected.map(item => item.code).join("")
    this.state.activity.activity_selected_list = activity_selected
  }

  onBlurSavePlan = async (pos) => {
    await this.orm.write("budget.plan.line", [pos.plan_line.id], {
      amount: this.parseNumber(
        this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`]
      ),
    });
    this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`] =
      this.formattedAmount(
        this.state.formated.amount[`${pos.plan_line.id}-${pos.id}`]
      );
    await this.fetchBudgetPlanLines()
    await this.mergeData()
    await this.generateState();
  };

  // onblur create save
  onBlurSaveCreate = async (pos) => {
    await this.orm.create("budget.plan.line", [
      {
        plan_id: this.state.budget_plan.budget_plan_id,
        activity_analytic_id: this.state.activity.select_activity,
        fund_analytic_id: this.state.fund,
        template_line_id: pos.id,
        amount: this.parseNumber(
          this.state.formated.amount[`${pos.code}-${pos.id}`]
        ),
      },
    ]);
    this.state.formated.amount[`${pos.code}-${pos.id}`] = this.formattedAmount(
      this.state.formated.amount[`${pos.code}-${pos.id}`]
    );
    await this.fetchBudgetPlanLines()
    await this.mergeData()
    await this.generateState();
    
  };

  // รวมข้อมูล
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
          };
        }
      );

    this.state.budget_template.budget_template_line_data_list = mergedData.map(
      (item) => ({
        ...item,
        can_edit: item.has_children.length === 0,
        root_parent: item.parent_id
          ? parseInt(item.parent_path.split("/")[0])
          : item.id,
      })
    );
  }

  // fetch ข้อมูล
  async fetchData() {
    // หา ID budget_template
    const budget_template_id = await this.orm.call("budget.plan", "get_id", []);
    this.state.budget_template.budget_template_id = budget_template_id;

    // หากิจกรรม
    const plan_activity_id = await this.orm.searchRead(
      "account.analytic.plan",
      [["code", "=", "activities"]],
      []
    );
    const plan_activity = await this.orm.searchRead(
      "account.analytic.account",
      [["plan_id", "=", plan_activity_id[0].id]],
      []
    );
    this.state.activity.activity_list = plan_activity;

    // หากองทุน
    const plan_fund_id = await this.orm.searchRead(
      "account.analytic.plan",
      [["code", "=", "funds"]],
      []
    );

    // หา กองทุน
    const plan_fund = await this.orm.searchRead(
      "account.analytic.account",
      [["plan_id", "=", plan_fund_id[0].id]],
      [],
      { limit: 2 }
    );
    this.state.budget_plan.budget_fund = plan_fund;

    // หา budget_template
    const get_structure_template_line = await this.orm.call(
      "report.budget.budget_template_structure",
      "get_html",
      [this.state.budget_template.budget_template_id]
    );

    this.state.budget_template.budget_template_name =
      get_structure_template_line["budget_template"].name;
    this.state.budget_template.budget_template_line_data_list =
      get_structure_template_line["lines"];

    // หา budget plan id
    const budget_plan_id = await this.orm.searchRead(
      "budget.plan",
      [["template_id", "=", this.state.budget_template.budget_template_id]],
      []
    );
    this.state.budget_plan.budget_plan_id = budget_plan_id[0].id;
    this.state.fund = budget_plan_id[0].source_analytic_id[0];

    // หา budget plan line id
    await this.fetchBudgetPlanLines();

    // หา capital ทั้งหมด
    await this.fetchBudgetCapital();
    await this.mergeData();
    await this.generateState();
  }
}

Expense_budget.template = "budget_plan_ui.expense_budget";
Expense_budget.components = {
  Budget_control_panel,
  NoteEditor,
  CharField,
  IntegerField,
  Create_edit_modal,
};
registry.category("actions").add("expense_budget", Expense_budget);
