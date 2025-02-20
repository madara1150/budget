{
    "name": "KMITL Budgeting",
    "version": "16.0.1.0.0",
    "summary": """ KMITL Budgeting""",
    "category": "KMITL/Budgeting",
    "author": "Aginix Technologies",
    "website": "https://github.com/aginix/kmitl",
    "depends": ["account", "account_fiscal_year", "mail"],
    "data": [
        "views/budget_template_views.xml",
        "views/budget_menus.xml",
        "security/ir.model.access.csv",
    ],
    "demo": [
        "demo/account.fiscal.year.csv",
        "demo/budget.template.csv",
        "demo/budget.template.line.csv",
    ],
    "assets": {
        "web.assets_backend": ["budget/static/src/**/*"],
    },
    "auto_install": False,
    "application": True,
    "license": "AGPL-3",
}
