/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {
  Component,
  useState,
  onWillStart,
} from "@odoo/owl";
import { Budget_control_panel } from "../budget_control_panel/budget_control_panel"
import { NoteEditor } from "../note_editor/note_editor"

  export class Revenue_budget extends Component {

    setup() {
        this.controlPanelDisplay = {
            "top-right": false,
            "bottom-right": false,
        };
        this.env.config.viewSwitcherEntries = [];

        this.orm = useService("orm");
        this.action = useService("action");
        this.state = useState({
            budget_plan:{
                budget_plan_data:[],
                budget_plan_department_name:"",
                budget_plan_merge:[]
            },
            noteValue:"",
            budget_plan_line:{
                budget_plan_line_data:[],
                budget_plan_line_amount:{},
                budget_plan_line_note:{}
            },
            budget_template:{
                budget_template_data: []
            },
            budget_template_line:{
                budget_template_line_data: [],
                budget_template_merge:[]
            },
            tuition_fee:{
                tuition_fee_data:[]
            },
            total:{
                total_sum_bachelor:0,
                total_sum_master:0,
                total_sum_professional:0,
                total_sum_all: 0
            },
            toggle:{
                note:{}
            }

        })

        onWillStart(async () => {
            await this.fetchData();
            await this.sumTotal();
            await this.mergeData();
            await this.generateState()
        });
      }

      updateNote = async (note, data) =>{
        if(!data.plan_line){
          await this.orm.create("budget.plan.line", [
            {
              plan_id: this.state.budget_plan.budget_plan_data.id,
              note: note,
              template_line_id: data.id,
            },
          ]);
        }
        else{
          await this.orm.write("budget.plan.line", [data.plan_line.id], {
            note: note,
          });
        }
        await this.fetchData();
        await this.generateState()
    }

      async sumTotal(){
        const totalFeeSumBachelor = this.state.tuition_fee.tuition_fee_data.filter(data => data.class_fee_type[1] === "ปริญญาตรี" || data.class_fee_type[1] == "ปริญญาตรี4+1").reduce((sum, data) => sum + data.total_fee, 0);
        this.state.total.total_sum_bachelor = totalFeeSumBachelor
        const totalFeeSumMaster = this.state.tuition_fee.tuition_fee_data.filter(data => data.class_fee_type[1] === "ปริญญาโท").reduce((sum, data) => sum + data.total_fee, 0);
        this.state.total.total_sum_master = totalFeeSumMaster
        const totalFeeSumProfessional = this.state.tuition_fee.tuition_fee_data.filter(data => data.class_fee_type[1] === "ปริญญาเอก").reduce((sum, data) => sum + data.total_fee, 0);
        this.state.total.total_sum_professional = totalFeeSumProfessional
        this.state.total.total_sum_all = totalFeeSumBachelor + totalFeeSumMaster + totalFeeSumProfessional
      }

      async mergeData(){
        const mergeData = this.state.budget_template_line.budget_template_line_data.map(
            (templateLine) => {

              const matchingPlanLine = this.state.budget_plan_line.budget_plan_line_data.find(
                (planLine) => planLine.template_line_id[0] === templateLine.id
              );
              return {
                ...templateLine,
                plan_line: matchingPlanLine || null,
              };
            }
        )
        this.state.budget_template_line.budget_template_merge = mergeData
      }

      async generateState(){
        const data = this.state.budget_template_line.budget_template_merge.map(data => {
          if (data.plan_line){
            this.state.budget_plan_line.budget_plan_line_amount[`${data.plan_line.id}-${data.id}`] = data.plan_line.amount
            this.state.budget_plan_line.budget_plan_line_note[`${data.plan_line.id}-${data.id}`] = data.plan_line.note
          }
            return data.id
        });
      }

      async toggleNote(pos) {
        const key = `${pos.id}-${pos.code}`;
        this.state.toggle.note[key] = !this.state.toggle.note[key];
      }

      onBlurSavePlan = async (pos) => {
        await this.orm.write("budget.plan.line", [pos.plan_line.id], {
          amount: this.state.budget_plan_line.budget_plan_line_amount[`${pos.plan_line.id}-${pos.id}`],
        });
        await this.fetchData();
      };

      onBlurSaveCreate = async (pos) => {
        await this.orm.create("budget.plan.line", [
          {
            plan_id: this.state.budget_plan.budget_plan_data.id,
            template_line_id: pos.id,
            amount: this.state.budget_plan_line.budget_plan_line_amount[`${pos.code}-${pos.id}`],
          },
        ]);
        await this.fetchData()
        await this.mergeData()
        await this.generateState()
      };

      async fetchData() {
        const budget_template_id = await this.orm.call(
            "budget.plan",
            "get_id",
            []
        );

        const budget_plan_id = await this.orm.searchRead(
            "budget.plan",
            [["template_id", "=", budget_template_id]],
            []
          );
          this.state.budget_plan.budget_plan_data = budget_plan_id[0]
        //   budget_plan_id[0].department_analytic_id[1].split(" ");
          this.state.budget_plan.budget_plan_department_name = ""
        
          const budget_plan_line_id = await this.orm.searchRead(
            "budget.plan.line",
            [["plan_id", "=", this.state.budget_plan.budget_plan_data.id]],
            []
          );
          this.state.budget_plan_line.budget_plan_line_data = budget_plan_line_id

        const budget_template_data = await this.orm.searchRead(
            'budget.template',
            [["id", "=", budget_template_id]],
            []
        )
        this.state.budget_template.budget_template_data = budget_template_data[0]

        const budget_template_line_data = await this.orm.searchRead(
            'budget.template.line',
            [["id", "=", this.state.budget_template.budget_template_data.line_ids]],
            ["id", "name", "code", "parent_id", "child_ids", "hierarchy_level", "fund_analytic_ids"]
        )
        const budget_template_line_can_edit = budget_template_line_data.map(item => ({
            ...item,
            can_edit: item.child_ids.length === 0
        }));
        this.state.budget_template_line.budget_template_line_data = budget_template_line_can_edit

        const tuition_fee_data = await this.orm.searchRead(
            'tuition.fee',
            [['faculty_name' ,'=', 'เทคโนโลยีสารสนเทศ']],
            []
        )
        this.state.tuition_fee.tuition_fee_data = tuition_fee_data

        await this.mergeData();
      }

  }
  Revenue_budget.template = "budget_plan.revenue_budget"
  Revenue_budget.components = { Budget_control_panel,NoteEditor }
  registry.category("actions").add("revenue_budget", Revenue_budget);