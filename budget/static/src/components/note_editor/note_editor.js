/** @odoo-module **/

  import { Component, useState } from "@odoo/owl";

export class NoteEditor extends Component {
    setup() {
        this.state = useState({
            toggle: false,
            noteValue: this.props.note || "",
        });
    }

    toggleNote() {
        this.state.toggle = !this.state.toggle;
    }

    saveNote() {
        this.env.bus.trigger("note_saved", { 
            id: this.props.subchild.id, 
            value: this.state.noteValue 
        });
        this.state.toggle = false;
    }

    resetNote() {
        this.state.noteValue = this.props.note || "";
        this.state.toggle = false;
    }
}

NoteEditor.template = "budget.NoteEditor";
  