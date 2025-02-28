/** @odoo-module **/

import { Component, useState } from "@odoo/owl";

export class NoteEditor extends Component {
    setup() {
        this.state = useState({
            toggle: false,
            noteValue: this.props.data.plan_line ? 
            this.props.data.plan_line.note ? 
            this.props.data.plan_line.note : "" : "",
        });
    }

    async saveNote() {
        await this.props.updateNote(this.state.noteValue, this.props.data);
        this.toggleNote()
    }

    toggleNote() {
        this.state.toggle = !this.state.toggle;
    }

    resetNote() {
        this.state.noteValue = this.props.data.plan_line ?
         this.props.data.plan_line.note ? 
         this.props.data.plan_line.note : "" : "";
        this.state.toggle = false;
    }
}

NoteEditor.template = "budget_plan.NoteEditor";
  