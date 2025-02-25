# -*- coding: utf-8 -*-
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
    budget_plan_result = fields.Char(string="Selected Budget Plan")

    def action_budget_plan(self):
        """เปิด Wizard Budget Plan"""
        return {
            "type": "ir.actions.act_window",
            "name": "Budget Plan",
            "res_model": "budget.plan.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {"default_budget_option": self.budget_plan_result},
        }
