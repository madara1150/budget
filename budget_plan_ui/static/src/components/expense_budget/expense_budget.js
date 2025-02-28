/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart } from "@odoo/owl";
import { Budget_control_panel } from "../budget_control_panel/budget_control_panel";
import { NoteEditor } from "../note_editor/note_editor";

export class Expense_budget extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.state = useState({
      activity: {
        activity_active_name: "",
        activity_list: [],
        select_activity: 0,
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
      budget_salary_amount: {},
      budget_salary_note: {},
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
    });

    onWillStart(async () => {
      await this.fetchData();
      await this.generateState();
    });
  }

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
        amount: null,
      };
    }
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
    await this.fetchData();
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
    await this.fetchData();
  }

  // กลับหัวลูกสร
  async toggleRotate(key) {
    this.state.rotated[key] = !this.state.rotated[key];
    // await this.fetchData();
  }

  // ทำหน้าแสดง loading
  loadingToggle = async (name, id_active) => {
    this.state.activity.activity_active_name = name;
    this.state.activity.select_activity = id_active.id;
    this.state.load.loading = true;
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
          this.state.budget_salary_amount[`${data.plan_line.id}-${data.id}`] =
            data.plan_line.amount;
          this.state.budget_salary_note[`${data.plan_line.id}-${data.id}`] =
            data.plan_line.note;
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
    await this.fetchData();
  };

  // onBlur save amount
  onBlurSavePlan = async (pos) => {
    await this.orm.write("budget.plan.line", [pos.plan_line.id], {
      amount: this.state.budget_salary_amount[`${pos.plan_line.id}-${pos.id}`],
    });
  };

  onBlurSaveCreate = async (pos) => {
    await this.orm.create("budget.plan.line", [
      {
        plan_id: this.state.budget_plan.budget_plan_id,
        activity_analytic_id: this.state.activity.select_activity,
        fund_analytic_id: this.state.fund,
        template_line_id: pos.id,
        amount: this.state.budget_salary_amount[`${pos.code}-${pos.id}`],
      },
    ]);
  };

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

    this.state.budget_template.budget_template_line_data_list = mergedData;
  }

  async createCanEdit() {
    this.state.budget_template.budget_template_line_data_list =
      this.state.budget_template.budget_template_line_data_list.map((item) => ({
        ...item,
        can_edit: item.child_ids.length === 0,
        root_parent: item.parent_id
          ? parseInt(item.parent_path.split("/")[0])
          : item.id,
      }));
  }

  // fetch ข้อมูล
  async fetchData() {
    // หา ID budget_template
    const budget_template_id = await this.orm.call("budget.plan", "get_id", []);
    this.state.budget_template.budget_template_id = budget_template_id;

    // หากิจกรรม
    const plan_activity_id = await this.orm.searchRead(
      "account.analytic.plan",
      [["name", "=", "Activity (ด้าน/แผนงาน/กิจกรรม)"]],
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
      [["name", "=", "Fund (กองทุน)"]],
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
    const budget_template = await this.orm.searchRead(
      "budget.template",
      [["id", "=", this.state.budget_template.budget_template_id]],
      []
    );
    this.state.budget_template.budget_template_name = budget_template[0].name;
    this.state.budget_template.budget_template_line_list =
      budget_template[0].line_ids;

    // หา budget_template_line
    const budget_template_lines = await this.orm.searchRead(
      "budget.template.line",
      [["id", "=", this.state.budget_template.budget_template_line_list]],
      [
        "id",
        "name",
        "code",
        "parent_id",
        "child_ids",
        "hierarchy_level",
        "fund_analytic_ids",
        "parent_path",
      ],
      { order: "code asc" }
    );
    this.state.budget_template.budget_template_line_data_list =
      budget_template_lines;
    // หา budget plan id
    const budget_plan_id = await this.orm.searchRead(
      "budget.plan",
      [["template_id", "=", this.state.budget_template.budget_template_id]],
      []
    );
    this.state.budget_plan.budget_plan_id = budget_plan_id[0].id;
    this.state.fund = budget_plan_id[0].source_analytic_id[0];

    // หา budget plan line id
    const budget_plan_line_id = await this.orm.searchRead(
      "budget.plan.line",
      [["plan_id", "=", this.state.budget_plan.budget_plan_id]],
      []
    );
    this.state.budget_plan.budget_plan_line_list = budget_plan_line_id;

    await this.createCanEdit();

    // หา capital ทั้งหมด
    const capital_expenditure_id = await this.orm.searchRead(
      "capital.expenditure",
      [],
      []
    );
    this.state.capital.capital_expenditure_list = capital_expenditure_id;
    await this.mergeData();
    await this.generateState();
  }
}

Expense_budget.template = "budget_plan.expense_budget";
Expense_budget.components = { Budget_control_panel, NoteEditor };
registry.category("actions").add("expense_budget", Expense_budget);
