# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class BudgetPlanWizard(models.TransientModel):
    _name = "budget.plan.wizard"
    _description = _("BudgetPlanWizard")

    budget_option = fields.Selection(
        [
            ("option_1", "Option 1"),
            ("option_2", "Option 2"),
            ("option_3", "Option 3"),
        ],
        string="Select Budget",
        required=True,
    )

    def action_confirm(self):

        active_id = self.env.context.get("active_id")
        if active_id:
            bom = self.env["mrp.bom"].browse(active_id)
            bom.budget_plan_result = self.budget_option
        return {"type": "ir.actions.act_window_close"}
