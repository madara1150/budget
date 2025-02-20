/** @odoo-module **/

  import { registry } from "@web/core/registry";
  import { Layout } from "@web/search/layout";
  import { getDefaultConfig } from "@web/views/view";

  import { Component, useSubEnv } from "@odoo/owl";

  export class Revenue_budget extends Component {

    setup() {
          useSubEnv({
              config: {
                  ...getDefaultConfig(),
                  ...this.env.config,
              },
          });
      }
  }
  Revenue_budget.template = "budget.Revenue_budget"
  Revenue_budget.components = { Layout };
  registry.category("actions").add("revenue_budget", Revenue_budget);