# -*- coding: utf-8 -*-
import json
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class BudgetPlanWizard(models.TransientModel):
    _name = "budget.plan.wizard"
    _description = _("Budget Plan Wizard")

    template_id = fields.Many2one(
        "budget.template", string="Budget Template", required=True
    )
    fund_analytic_id = fields.Many2one(
        "account.analytic.account", string="Fund Analytic"
    )
    wizard_line_ids = fields.One2many(
        "budget.plan.wizard.line", "wizard_id", string="Budget Lines"
    )
    mrp_bom_id = fields.Many2one("mrp.bom", string="MRP BOM")

    @api.onchange("template_id")
    def _onchange_template(self):
        """เมื่อเลือก template_id ให้โหลดข้อมูล template lines"""
        if self.template_id:
            report_model = self.env["report.budget.budget_template_structure"]
            data = report_model.get_html(self.template_id.id)

            self.wizard_line_ids.unlink()

            for line in data.get("lines", []):
                if not line.get("id"):
                    continue
                self.env["budget.plan.wizard.line"].create(
                    {
                        "wizard_id": self.id,
                        "template_line_id": line["id"],
                        "code": line["code"],
                        "name": line["name"],
                        "amount": 0.0,
                    }
                )

    def action_confirm(self):
        """เมื่อกด Confirm ให้บันทึกข้อมูลไปยัง MRP BOM"""
        if self.mrp_bom_id:
            data = {
                "template_id": self.template_id.id,
                "fund_analytic_id": (
                    self.fund_analytic_id.id if self.fund_analytic_id else None
                ),
                "lines": [
                    {
                        "template_line_id": line.template_line_id.id,
                        "code": line.code,
                        "name": line.name,
                        "amount": line.amount,
                    }
                    for line in self.wizard_line_ids
                ],
            }

            self.mrp_bom_id.final_data = json.dumps(data, ensure_ascii=False)

        return {"type": "ir.actions.act_window_close"}


class BudgetPlanWizardLine(models.TransientModel):
    _name = "budget.plan.wizard.line"
    _description = _("Budget Plan Wizard Line")

    wizard_id = fields.Many2one(
        "budget.plan.wizard", string="Wizard", ondelete="cascade"
    )
    template_line_id = fields.Many2one(
        "budget.template.line",
        string="Template Line",
    )
    code = fields.Char(string="Code")
    name = fields.Char(string="Name")
    amount = fields.Float(string="Amount", default=0.0)
