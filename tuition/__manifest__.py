# -*- coding: utf-8 -*-
{
    'name': 'Tuition',
    'version': '16.0.1.0.0',
    'summary': """ Tuition Summary """,
    'author': '',
    'website': '',
    'category': '',
    'depends': ['base', 'web'],
    "data": [
        "views/tuition_fee_views.xml",
        "security/ir.model.access.csv",
        "views/education_semester_views.xml",
        "views/education_level_views.xml",
        "views/education_program_views.xml"
    ],'assets': {
              'web.assets_backend': [
                  'tuition/static/src/**/*'
              ],
          },
    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
