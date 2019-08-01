class UndoRedo {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return -1;
        this.redoStack.push(this.undoStack.pop());
        return this.undoStack[this.undoStack.length - 1];
    }

    redo() {
        if (this.redoStack.length === 0) return -1;
        let cur = this.redoStack.pop();
        this.undoStack.push(cur);
        return cur;
    }

    addState(line, pos) {
        this.undoStack.push({line, pos});
        this.redoStack = [];
    }
}

module.exports = UndoRedo;