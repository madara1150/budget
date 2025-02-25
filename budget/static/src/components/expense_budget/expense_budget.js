/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {
  Component,
  useState,
  onWillStart,
  onMounted,
  useEffect,
} from "@odoo/owl";
import { Budget_control_panel } from "../budget_control_panel/budget_control_panel"

export class Expense_budget extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.state = useState({
      activity: {
        activity_active_name: "",
        activity_list:[],
        select_activity:0
      },
      load:{
        loading:false
      },
      capital:{
        capital_expenditure_list:[],
        capital_id:0,
        name:'',
        expected_purchase_date:"",
        payment_plan:"single",
        note: "",
        amount:0,

      },
      budget_template: {
        budget_template_id:0,
        budget_template_line_list: [],
        budget_template_line_data_list: [],
        budget_template_name:"",
      },
      budget_salary_amount: {},
      budget_salary_note: {},
      rotated: {},
      budget_plan: {
        budget_fund: [],
        budget_activity: [],
        budget_plan_line_list: [],
        budget_plan_line_modal:[],
        budget_plan_line_id:0,
        budget_plan:0,
        plan_name:"",
        budget_plan_id:0,
      },
    });

    onWillStart(async () => {
      await this.fetchData();
      await this.generateState()
    });
  }

  // กลับหัวลูกสร
  async toggleRotate(key) {
    this.state.rotated[key] = !this.state.rotated[key];
    await this.fetchData();
  }

  // ทำหน้าแสดง loading
  loadingToggle = async (name, id_active) => {
    this.state.activity.activity_active_name = name;
    this.state.activity.select_activity = id_active.id
    this.state.load.loading = true;
    setTimeout(async () => {
      this.state.load.loading = false;
      await this.fetchData();
    }, 1000);
    await this.fetchData();
  };

  // เมื่อทำการเลือก plan จะ fetch ข้อมูลใหม่ 
  async onBudgetPlanChange() {
    await this.fetchData();
    const budget_template_lines = await this.orm.searchRead(
      "budget.template.line",
      [["id", "=", this.state.budget_plan.budget_plan]],
      [],
    );
    this.state.budget_plan.plan_name = budget_template_lines[0].name

  }

  // reset ค่า state ให้แสดง
  async generateState(){
    const data = this.state.budget_template.budget_template_line_data_list.map(data => {
      if (data.plan_line){
        this.state.budget_salary_amount[`${data.plan_line.id}-${data.id}`] = data.plan_line.amount
        this.state.budget_salary_note[`${data.plan_line.id}-${data.id}`] = data.plan_line.note
      }
        
        return data.id
    });
  }

  // toggle เปิด-ปิด Note 
  async toggleNote(fund_id, pos_code) {
    const key = `${fund_id}-${pos_code}`;
    this.state[key] = !this.state[key];
  }

  // ปุ่มบันทึก save Note
  saveDataNote = async (pos, fund) => {
    if(this.state.budget_salary_note[`${fund}-${pos.code}`]){
      await this.orm.create("budget.plan.line", [
        {
          plan_id: this.state.budget_plan.budget_plan_id,
          note: this.state.budget_salary_note[`${fund}-${pos.code}`],
          activity_analytic_id: this.state.activity.select_activity,
          fund_analytic_id: fund,
          template_line_id: pos.id,
          amount: this.state.budget_salary_amount[`${pos.code}-${pos.id}`],
        },
      ]);
    }
    else{
      await this.orm.write("budget.plan.line", [pos.plan_line.id], {
        note: this.state.budget_salary_note[`${pos.plan_line.id}-${pos.id}`],
      });
    }
    
    this.state[`${fund}-${pos.code}`] = !this.state[`${fund}-${pos.code}`];
    await this.fetchData();
    await this.generateState()
  };

  // ปุ่มยกเลิก Note
  resetDataNote = (pos, fund_id) => {
    this.state.budget_salary_note[`${pos.plan_line.id}-${pos.id}`] = pos.plan_line.note;
    this.state[`${fund_id}-${pos.code}`] =
      !this.state[`${fund_id}-${pos.code}`];
  };

  // onBlur save amount 
  onBlurSavePlan = async (pos, fund) => {
    await this.orm.write("budget.plan.line", [pos.plan_line.id], {
      amount: this.state.budget_salary_amount[`${pos.plan_line.id}-${pos.id}`],
    });
    await this.fetchData();
  };
  
  // onBlur เมื่อไม่มี plan_line จะสร้าง
  onBlurSaveCreate = async (pos, fund) => {
    await this.orm.create("budget.plan.line", [
      {
        plan_id: this.state.budget_plan.budget_plan_id,
        note: this.state.budget_salary_note[`${pos.code}-${pos.id}`],
        activity_analytic_id: this.state.activity.select_activity,
        fund_analytic_id: fund,
        template_line_id: pos.id,
        amount: this.state.budget_salary_amount[`${pos.code}-${pos.id}`],
      },
    ]);
    await this.fetchData()
    await this.generateState()
  };

  // งบลงทุน กดเพิ่มเพื่อเพิ่มข้อมูล
  async modalCapital(capital) {
    if(capital.plan_line){
      this.state.budget_plan.budget_plan_line_modal = capital.capital_expenditures
      this.state.budget_plan.budget_plan_line_id = capital.plan_line.id;
    }
  }

  // กดแก้ไขข้อมูล Modal ที่เป็น capital
  async openEditCapital(capital) {
    this.state.capital.capital_id = capital.id;
    this.state.capital.name = capital.name;
    this.state.capital.expected_purchase_date =
    capital.expected_purchase_date;
    this.state.capital.payment_plan = capital.payment_plan;
    this.state.capital.amount = capital.amount;
    this.state.capital.note = capital.note;
  }

  // ลบ Capital ใน Modal
  async deleteCapital(capital) {
    await this.orm.unlink("capital.expenditure", [capital.id]);
    await this.fetchData();
  }

  // กดเพื่อเปิด modal สร้าง capital
  async openCreateCapital(capital) {
    await this.resetFormEdit();
  }

  // reset form เพื่อสร้างข้อมูลใหม่ Capital
  async resetFormEdit() {
    this.state.capital.capital_id = 0;
    this.state.capital.name = "";
    this.state.capital.expected_purchase_date = "";
    this.state.capital.payment_plan = "single";
    this.state.capital.amount = 0;
    this.state.capital.note = "";
  }

  // สร้าง capital ใหม่
  async saveCapital() {
    if(this.state.budget_plan.budget_plan_line_id){
      const data = await this.orm.create("capital.expenditure", [
        {
          name: this.state.capital.name,
          expected_purchase_date:
            this.state.capital.expected_purchase_date,
          amount: this.state.capital.amount,
          note: this.state.capital.note,
          budget_plan_line_id:
            this.state.budget_plan.budget_plan_line_id,
          payment: "single",
        },
      ]);
    }
   
    await this.fetchData();
  }

  // บันทึกการแก้ไข Capital
  async saveEditCapital() {
    await this.orm.write(
      "capital.expenditure",
      [this.state.capital.capital_id],
      {
        name: this.state.capital.name,
        expected_purchase_date:this.state.capital.expected_purchase_date,
        amount: this.state.capital.amount,
        note: this.state.capital.note,
      }
    );
    await this.fetchData();
  }

  // fetch ข้อมูล
  async fetchData() {
    // หา ID budget_template
    const budget_template_id = await this.orm.call(
      "budget.template",
      "get_id",
      []
    );
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
      ["id", "name", "code", "parent_id", "child_ids"],
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

    // หา budget plan line id
    const budget_plan_line_id = await this.orm.searchRead(
      "budget.plan.line",
      [["plan_id", "=", this.state.budget_plan.budget_plan_id]],
      []
    );
    this.state.budget_plan.budget_plan_line_list = budget_plan_line_id;

    // หา capital ทั้งหมด
    const capital_expenditure_id = await this.orm.searchRead(
      "capital.expenditure",
      [],
      []
    );
    this.state.capital.capital_expenditure_list = capital_expenditure_id

    // รวมข้อมูลเข้าด้วยกัน เพื่อ Loop
    const mergedData = this.state.budget_template.budget_template_line_data_list.map(
      (templateLine) => {
        // ค้นหา plan_line ที่ตรงกับ templateLine.id
        const matchingPlanLine = this.state.budget_plan.budget_plan_line_list.find(
          (planLine) => planLine.template_line_id[0] === templateLine.id
        );
    
        // ค้นหา capital_expenditure ที่ตรงกับ plan_line.id
        const matchingCapitalExpenditures = this.state.capital.capital_expenditure_list.filter(
          (capital) => matchingPlanLine && capital.budget_plan_line_id[0] === matchingPlanLine.id
        );
    
        return {
          ...templateLine,
          plan_line: matchingPlanLine || null,
          capital_expenditures: matchingCapitalExpenditures.length > 0 ? matchingCapitalExpenditures : null,
        };
      }
    );
    
    this.state.budget_template.budget_template_line_data_list = mergedData;
  }
}

Expense_budget.template = "budget.expense_budget";
Expense_budget.components = { Budget_control_panel }
registry.category("actions").add("expense_budget", Expense_budget);
