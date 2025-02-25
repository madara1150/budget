# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class EducationProgram(models.Model):
    _name = "education.program"
    _description = "EducationProgram"

    name = fields.Char(string="หลักสูตร", required=True)
