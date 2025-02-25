# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class TuitionFee(models.Model):
    _name = "tuition.fee"
    _description = "Tuition Fee Information"

    semester = fields.Many2one(
        "education.semester", string="เทอมการศึกษา", required=True
    )
    faculty_name = fields.Char(string="คณะ", required=True)
    class_fee_type = fields.Many2one(
        "education.level", string="ระดับการศึกษา", required=True
    )
    academic_year = fields.Integer(string="ชั้นปี", required=True)
    tuition_fee = fields.Float(string="ค่าเทอมต่อคน", required=True)
    student_count = fields.Integer(string="จำนวนนักศึกษา", required=True)
    total_fee = fields.Float(
        string="รวมค่าเทอม", compute="_compute_total_fee", store=True
    )
    program_name = fields.Many2one("education.program", string="หลักสูตร", required=True)

    @api.depends("tuition_fee", "student_count")
    def _compute_total_fee(self):
        for record in self:
            record.total_fee = record.tuition_fee * record.student_count
