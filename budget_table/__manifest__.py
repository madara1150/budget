# -*- coding: utf-8 -*-
{
    "name": "Budget_table",
    "version": "16.0.1.0.0",
    "summary": """ Budget_table Summary """,
    "author": "",
    "website": "",
    "category": "",
    "depends": ["base", "web", "budget", "budget_plan_ui"],
    "data": [
        "views/budget_appropriation_action_views.xml"
    ],
    "assets": {
        "web.assets_backend": ["budget_table/static/src/**/*"],
    },
    "application": True,
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}
