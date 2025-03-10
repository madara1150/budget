# -*- coding: utf-8 -*-
import json
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


from odoo import fields, models


class MrpBomInherit(models.Model):
    _inherit = "mrp.bom"

    budget_type = fields.Selection(
        [
            ("no_budget", "ไม่ขอใช้เงิน"),
            ("budget", "ขอใช้งบประมาณ"),
        ],
        default="no_budget",
        string="budget",
    )
    final_data = fields.Text(string="Selected Budget Plan")

    # def action_budget_plan(self):
    #     """เปิด Wizard Budget Plan"""
    #     self.ensure_one()
    #     print("test ====>", self.final_data)
    #     wizard_values = {
    #         "final_data": self.final_data,
    #         "template_id": self.template_id.id if self.template_id else False,
    #         "fund_analytic_id": (
    #             self.fund_analytic_id.id if self.fund_analytic_id else False
    #         ),
    #     }
    #     wizard = self.env["budget.plan.wizard"].create(wizard_values)

    #     return {
    #         "type": "ir.actions.act_window",
    #         "name": "Budget Plan",
    #         "res_model": "budget.plan.wizard",
    #         "view_mode": "form",
    #         "res_id": wizard.id,
    #         "target": "new",
    #         "context": {
    #             "default_final_data": wizard.final_data,
    #             "default_template_id": wizard.template_id.id,
    #             "default_fund_analytic_id": wizard.fund_analytic_id.id,
    #         },
    #     }

    def action_budget_plan(self):
        """เปิด Wizard Budget Plan"""
        # self.ensure_one()
        # final_data_dict = json.loads(self.final_data) if self.final_data else {}

        # template_id = final_data_dict.get("template_id", False)
        # fund_analytic_id = final_data_dict.get("fund_analytic_id", False)
        # lines = final_data_dict.get("lines", [])
        # wizard = self.env["budget.plan.wizard"].search(
        #     [("mrp_bom_id", "=", self.id)], limit=1
        # )
        # print("wizard ===>", wizard)
        # if final_data_dict:
        #     wizard_values = {
        #         "template_id": template_id,
        #         "fund_analytic_id": fund_analytic_id,
        #         "wizard_line_ids": [
        #             (
        #                 0,
        #                 0,
        #                 {
        #                     "template_line_id": line["template_line_id"],
        #                     "amount": line.get("amount", 0.0),
        #                 },
        #             )
        #             for line in lines
        #         ],
        #     }

        #     wizard = self.env["budget.plan.wizard"].create(wizard_values)
        return {
            "type": "ir.actions.act_window",
            "name": "Budget Plan",
            "res_model": "budget.plan.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {
                "default_mrp_bom_id": self.id,
            },
        }
        # return {
        #     "type": "ir.actions.act_window",
        #     "name": "Budget Plan",
        #     "res_model": "budget.plan.wizard",
        #     "view_mode": "form",
        #     "res_id": wizard.id,
        #     "target": "new",
        #     "context": {
        #         "default_mrp_bom_id": self.id,
        #     },
        # }
