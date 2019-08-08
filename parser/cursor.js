class Cursor {
    constructor(field) {
        this.field = field;
    }

    get position() {
        this.pos = 0;
        this.anchorNode = window.getSelection().anchorNode;
        this.offset = window.getSelection().anchorOffset;
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
        return this.pos;
    }

    set position(position) {
        let curNode = this.field;
        let curPos = 0, i = -1;
        while (curPos < position && curNode.nodeType !== 3) {
            i++;
            if (curNode.childNodes[i] !== null) {
                curPos += curNode.childNodes[i].textContent.length;
                if (curPos >= position) {
                    curNode = curNode.childNodes[i];
                    curPos -= curNode.textContent.length;
                    i = -1;
                }
            }
        }
        document.getSelection().collapse(curNode, position - curPos);
    }
}

module.exports = Cursor;