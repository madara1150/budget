# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class EducationSemester(models.Model):
    _name = "education.semester"
    _description = "EducationSemester"

    name = fields.Char(string="เทอมการศึกษา", required=True)
