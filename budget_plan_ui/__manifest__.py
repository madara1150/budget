# -*- coding: utf-8 -*-
{
    "name": "Budget_plan_ui",
    "version": "16.0.1.0.0",
    "summary": """ Budget_plan_ui Summary """,
    "author": "",
    "website": "",
    "category": "",
    "depends": ["base", "web", "budget_plan"],
    "data": [
        "views/capital_expenditure_views.xml",
        "security/ir.model.access.csv",
        "views/budget_plan_views.xml"
    ],
    "assets": {
        "web.assets_backend": ["budget_plan_ui/static/src/**/*"],
    },
    "application": True,
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}
