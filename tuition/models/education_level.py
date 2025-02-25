# -*- coding: utf-8 -*-
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class EducationLevel(models.Model):
    _name = "education.level"
    _description = "EducationLevel"

    name = fields.Char(string="ระดับการศึกษา", required=True)
