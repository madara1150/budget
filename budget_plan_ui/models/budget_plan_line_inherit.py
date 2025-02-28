# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class BudgetPlanLineInherit(models.Model):
    _inherit = "budget.plan.line"

    note = fields.Text(string="Note")
    capital_expenditure_ids = fields.One2many(
        "capital.expenditure", "budget_plan_line_id", string="Capital Expenditure Plans"
    )
