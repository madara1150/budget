# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError
from odoo.http import request

_logger = logging.getLogger(__name__)


class BudgetPlanInherit(models.Model):
    _inherit = "budget.plan"

    budget_type = fields.Selection(
        related="template_id.budget_type", string="Budget Type", store=True
    )

    @api.model
    def get_id(self):
        session = request.session
        budget_id = session.get("budget_template_id")
        return budget_id or 0
