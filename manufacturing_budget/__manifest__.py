# -*- coding: utf-8 -*-
{
    "name": "Manufacturing_budget",
    "version": "16.0.1.0.0",
    "summary": """ Manufacturing_budget Summary """,
    "author": "",
    "website": "",
    "category": "",
    "depends": ["base", "web", "mrp"],
    "data": [
        "views/mrp_bom_inherit_views.xml",
        "wizards/budget_plan_wizard.xml",
        "security/ir.model.access.csv",
    ],
    "assets": {
        "web.assets_backend": ["manufacturing_budget/static/src/**/*"],
    },
    "application": True,
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}
