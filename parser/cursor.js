class Cursor {
    constructor(field) {
        this.field = field;
        this.anchorNode = window.getSelection().anchorNode;
        this.offset = window.getSelection().anchorOffset;
        this.pos = 0;
    }

    getCursor() {
        if (this.anchorNode.parentNode === this.field) {
            this.pos = this.offset;
        }
        else {
            let curNode = this.anchorNode;
            while (curNode !== this.field) {
                while (curNode.previousSibling !== null) {
                    this.pos += curNode.previousSibling.textContent.length;
                    curNode = curNode.previousSibling;
                }
                curNode = curNode.parentNode;
            }
            this.pos += this.offset;
        }
    }

    setCursor(field) {
        let curNode = field;
        let curPos = 0, i = -1;
        while (curPos < this.pos) {
            i++;
            if (curNode.childNodes[i] !== null) {
                curPos += curNode.childNodes[i].textContent.length;
            }
            else {
                curNode = curNode.childNodes[i];
                if (curNode.childNodes.length === 0)  {
                    break;
                }
            }
        }
        if (i !== -1) curNode = curNode.childNodes[i];
        document.getSelection().collapse(curNode.firstChild !== undefined ? curNode.firstChild : curNode,
            this.pos - (curPos - curNode.textContent.length));
    }
}

module.exports = Cursor;