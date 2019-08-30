[![Build Status](https://travis-ci.com/xel23/WebEditorForQueryLanguage.svg?branch=master)](https://travis-ci.com/xel23/WebEditorForQueryLanguage)

Web editor for YouTrack query grammar on frontend.
-
Parser for [YouTrack grammar](https://www.jetbrains.com/help/youtrack/standalone/Search-Query-Grammar.html)

Stack
-
* ES-2015
* Node.js (^10.15)
* Webpack
* Jest
* Travis

Getting start
-
1. To start server use npm
    ```
    npm start
    ```
2. Then open in your browser (it has support Chrome and Firefox last 2 versions)
    ```
    localhost:8080
    ```

GitHub page
-
[Click here to open GitHub page with UI](https://xel23.github.io/WebEditorForQueryLanguage/)

Example of parsing
-
![Parser](https://i.imgur.com/E7abrXW.png)

Parser has full support of grammar.

Highlighter
-
![Highlighter](https://i.imgur.com/ZZRY47s.gif)
1. Orange is a text
2. Black is a key
3. Blue is a value

#### How it looks in DOM:
![DOM Highlighter](https://i.imgur.com/jo3h9nl.png)

Hot Keys
-
* ⌃+z - undo
* ⌃+⇧+z - redo
* ⌥+↑ - select node

Select node
-
![Select node](https://i.imgur.com/0Omb74s.gif)

Undo/Redo
-
![Undo/redo](https://i.imgur.com/QbBwX4r.gif)