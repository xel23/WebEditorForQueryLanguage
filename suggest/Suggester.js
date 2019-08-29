class Suggester {
    constructor(field) {
        this.popUp = document.createElement('div');
        this.popUp.setAttribute('class', 'popUp');
        this.field = field;
        let styles = document.createElement('style');
        styles.innerText = `
            .suf, .pre { 
                color: grey; 
            } 
            .explanation { 
                border-top: 1px solid grey; 
                background-color: #f7f9fa;
                padding: 3px 16px 5px;
            }
            .popUp {
                
            }
            .suggestLine {
                padding: 3px 16px 5px;
            }`;
        document.head.appendChild(styles);
    }

   async suggest(text, position) {
        if (text == null || text === "") {
            this.popUp.innerHTML = '';
            return;
        }
        let resp = await fetch('https://youtrack.jetbrains.com/rest/search/underlineAndSuggest?$top=-1&caret=' + position + '&query=' + text,
            {
                method: 'GET'
            });

        resp.text().then(res => {
            JSON.parse(res)['suggest']['items'].forEach( item => {
                let suggestLine = document.createElement('div');
                suggestLine.setAttribute('class', 'suggestLine');
                let pre, suf;
                if ('pre' in item) {
                    pre = document.createElement('span');
                    pre.setAttribute('class', 'pre');
                    pre.innerText = item['pre'];
                    suf = document.createElement('span');
                    suf.setAttribute('class', 'suf');
                }
                suggestLine.innerText = item['o'];
                this.popUp.appendChild(suggestLine);
            })
        }).then(() => {
            let explanation = document.createElement('div');
            explanation.innerText = 'Press ↩ to complete selected item';
            explanation.setAttribute('class', 'explanation');
            this.popUp.appendChild(explanation);
        });

        this.popUp.innerText = "";
        let coords = this.field.getBoundingClientRect();
        let elem = document.getSelection().anchorNode.parentElement.getBoundingClientRect();
        this.popUp.setAttribute('style', 'position: absolute; text-align:left; ' +
            'background-color: white; z-index: 1; border: 1px solid #53a7ff; border-top: none; top: '
           + (coords.y + coords.height).toString() + 'px;' +
           'left: ' + (elem.x + elem.width - 10).toString() + 'px;');

        document.body.appendChild(this.popUp);
    }
}

module.exports = Suggester;