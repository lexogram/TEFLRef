/** content.js **
 *
 *
**/



;(function contentLoaded(){
  "use strict"


  // POLYFILLS // POLYFILLS // POLYFILLS // POLYFILLS // POLYFILLS //

    // http://stackoverflow.com/a/4314050/1927589
    if (!String.prototype.splice) {
      /*
       * The splice() method changes the content of a string by
       * removing a range of characters and/or adding new characters.
       *
       * @this {String}
       * @param  {number} start       Index at which to start changing
       *                              the string.
       * @param  {number} deleteCount An integer indicating the number 
       *                              of old chars to remove.
       * @param  {string} insertion   The String that is spliced in.
       * @return {string}             A new string with the spliced
       *                              substring.
       */
      
      String.prototype.splice = function(
        start = 0
      , deleteCount = 0
      , insertion = "") {
        return this.slice(0, start)
             + insertion
             + this.slice(start + Math.abs(deleteCount))
      }
    }


    if (!Array.prototype.cycle) {
      Array.prototype.cycle = function(backwards) {
        if (this.index === undefined) {
          this.index = this.length
        }

        this.index += (1 - (!!backwards) * 2)

        if (this.index < 0) {
          this.index = this.length - 1
        } else if (this.index > this.length - 1) {
          this.index = 0
        }

        return this[this.index]
      }
    }


    if (!Array.prototype.cherrypick) {
      Array.prototype.cherrypick = function(fn) {
        let basket = []
        let ii = this.length
        let item

        for ( ; ii-- ; ) {
          item = this[ii]

          if (fn(item)) {
            basket.unshift(item)
            this.splice(ii, 1)
          }
        }

        return basket
      }
    }

  /// POLYFILLS >>>


  var expressions = (function getExpressions(){
    // Parse the HTML page for the expressions array
    // If it exists, initialize extension

    let result = null

    let HTML = document.body.innerHTML
    let regex = 
    /\n\s*let\s+(\w+)\s*=\s*(\[[\S\s]*\])[\s\S]*new\s+\w+\.MarkUp\(\1/
    
    let match = regex.exec(HTML)

    if (match) {
      try {
        result = JSON.parse(match[2])
        initializeExtension()

      } catch (error) {}
    }

    return result
  })()


  /// CLASSES //  CLASSES //  CLASSES //  CLASSES //  CLASSES ///


  class TEFLRefPanel {
    constructor(expressions) {
      // console.log ("TEFLRefPanel loaded")

      this.expressions = expressions
      this._injectHTML()
      this._initialize()

      this.wordsOnlyRegex = /^.+?(?= \()/ // "word up toˇ (1) (Amend)"
      let level$ = "(" // group 2: A1 - C2 + Unlisted
                 +   "(?:A\\d|B\\d|C\\d|Unlisted)"
                 + ")?\\s*"
                 // Details of words found at this level
                 + "(?:\\d+ types\\s*\\/\\s*\\d+\\stokens?\\s*\\n"
                 + "\\d+\\.?\\d*%\\s*\\/\\s*\\d+\\.?\\d*%\\s*\\n"
                 + "\\(Hide words\\)\\s*\\n)?"
                // Words at this level
                 + "([\\s\\S]+?)"
                // Look as far as the beginning of the next level
                 + "(?:"
                 +   "(?=A1)|(?=A2)|(?=B1)|(?=B2)"
                 +  "|(?=C1)|(?=C2)|(?=Unlisted)|(?=Ω)"
                 + ")"

      this.levelRegex = new RegExp(level$, "g")
      this.levels = ["A1","A2","B1","B2","C1","C2","Unlisted"]
      this.positions = {}

      this.updatedArray = this._launderExpressions()

      // this.expression
      // this.parseRegex
      // this.occurrences
      // this.regex
      // this.regexString
      // this.wordLookUp
      // this.imageLookUp
      // this.flags
      // this.level
      // this.spans
      // ... pointers to each panel element
    }


    getState() {
      return this.expressions
      ? "TEFLRefPanel activated"
      : "Error: TEFLRefPanel activation failed"
    }


    goExpression(event) {
      let back = event && event.target && event.target.id === "back"
      let match
        , temp

      this.expression = this.updatedArray.cycle(back)
      // "skid(?:ding|s|ded);skid¡car skid!DW4"

      if (!this.expression) {
        // this.updatedArray is empty
        return
      }

      match = this.parseRegex.exec(this.expression)

      this._showInputs(match)
      this._showFlags()
      this._showOccurrences()
      this._showFlexion()

      this._requestWindowsUpdate()
    }


    newSelection(event) {
      let target = event.target

      switch (target) {
        case this.flexions:
          this._applyFlexion(target.value)
        break

        case this.showWord:
          this._updateLookUp("wordField", target.checked)
        break
        case this.showImage:
          this._updateLookUp("imageField", target.checked)
        break
        case this.showFlags:
          this._updateLookUp("flagsField", target.checked)
        break

        case this.dictionary:
          this._updateDictionary(target.value)
        break
        case this.wiktionary:
          this._updateWiktionary(target.value)
        break
        case this.tatoeba:
          this._updateTatoeba(target.checked)
        break
        case this.imageCheck:
          this._updateImages(target.checked)
        break
        case this.wikipedia:
          this._updateWikipedia(target.value)
        break

        case this.regexField:
          this._updateRegex(target.value)
        break
        case this.wordField:
          this._updateField("wordLookUp", target.value)
        break
        case this.imageField:
          this._updateField("imageLookUp", target.value)
        break
        // case this.flagsField:
        //   this._updateField("flags", target.value)
        // break
        // case this.levelField:
        //   this._updateField("level", target.value)
      }

      // console.log(target.id, target.checked || target.value)
    }


    scrollToOccurrence(event) {
      let back = event && event.target && event.target.id === "up"
      let occurrence = this.occurrences.cycle(back)

      if (occurrence) {
        occurrence.scrollIntoView()
        this.article.classList.remove("error")
        this.index.innerText= (this.occurrences.index + 1)

      } else {
        this.article.classList.add("error")
      }
    }


    addNewWords() {
      // console.log(this.addField.value)
      let expressions = this._parseCEFRInput(
        this.addField.value
      , this.updatedArray
      )

      // expressions are sorted by length, so that the content page
      // will apply them in order of decreasing complexity
      if (expressions instanceof Array && expressions.length) {
        this.updatedArray = expressions
        console.log(JSON.stringify(expressions))

        let message = {
          subject: "resetHTMLSpans"
        , expressions: JSON.stringify(expressions)
        }

        chrome.runtime.sendMessage(message)

        // expressions are now re-sorted by order of first appearance
        // so that we can step through them in text order
        this.positions = {}
        expressions.sort(this._orderByPosition.bind(this))
      }
    }


    removeExpression() {
      // console.log(this.expression)
      // console.log("before")
      // console.log(this.spans.map(span => span.dataset.link))

      let data = this._getData(this.expression)
      let link = data.link.replace(/\+/g, "\\+")
      let regexString = "<span\[^>]+(?=data-link\\s*=\\s*\""
                      + link
                      + "\")[^>]+>("
                      + data.term
                      + ")</span>"
      let regex = new RegExp(regexString, "g")
      let html = this.article.innerHTML
      let match

      // console.log("datalink", link)
      let unspun = this.spans.cherrypick(span => {
        return span.dataset.link === link
      })

      // console.log("after")
      // console.log(unspun.map(span => span.dataset.link))
      // console.log(this.spans.map(span => span.dataset.link))

      while (match = regex.exec(html)) {
        console.log(match)
        let start = match.index
        let deleteCount = match[0].length
        let insertion = match[1]
        html = html.splice(start, deleteCount, insertion)

        // html is now shorter and the next occurrence might be 
        // skipped if we don't adjust regex.lastIndex so that regex
        // starts looking for the next match immediately after the
        // end of the replaced string.
        regex.lastIndex += insertion.length - deleteCount
      }

      this.article.innerHTML = html

      this.htmlSpansReset()

      this.updatedArray.splice(this.updatedArray.index, 1)
      this.updatedArray.index -= 1
      this.goExpression()
    }


    redrawAndExport() {
      this._showUpdatedArray()
    }


    windowsCreated() {
      this.goExpression()

      return "Expression selected: " + this.expression
    }


    htmlSpansReset() {
      this.spans = [].slice.call(document.querySelectorAll("span"))

      return "HTML spans reset"
    }


    _parseCEFRInput (rawText, expressions = []) {
      rawText += "Ω"
      let match
        , words
        , level
        , index

      try {
        while (match = this.levelRegex.exec(rawText)) {
          level = "°" + (this.levels.indexOf(match[1]) + 1 || 7)
          // unlisted = default

          if (level < 2) {} else {
            words = match[2].split("\n")

            words = words.map(line => {
              // Be forgiving if there are no parentheses
              line = (line.match(this.wordsOnlyRegex) || [line])[0]
              // If this is manual input, there may be regex parens
              line = this._tweakRegexString(line)
              // Don't give level to empty lines
              return line
                   ? line + level
                   : line
            })

            // Remove empty lines and duplicates
            words = words.filter((line, index, array) => {
              return line !== "" && array.indexOf(line) === index
            })

            expressions = expressions.concat(words)
          }
        }
      } catch (error) {
        console.log(error)
        return "ERROR: " + JSON.stringify(error)
      }

      expressions.sort((a, b) => {
        return (b.length + (b.indexOf(" ") > -1) * 5)
             - (a.length + (a.indexOf(" ") > -1) * 5)
      })

      return expressions
    }


    _launderExpressions() {
      let expressions = this.expressions.slice()

      expressions.forEach((expression, index) => {
        let fixed = false
        let match = this.parseRegex.exec(expression)     
        let wordLookUp = match[2] || ""
        let imageLookUp = match[4] || ""

        let temp = wordLookUp.replace(/ /, "+")
        if (temp !== wordLookUp) {
          fixed = true
          match[2] = temp
        }

        temp = imageLookUp.replace(/ /, "+")
        if (temp !== imageLookUp) {
          fixed = true
          match[4] = temp
        }

        if (fixed) {
          expressions[index] = this._generateExpression(match)
        }
      })

      return expressions.sort(this._orderByPosition.bind(this))
    }


    _getExpressions() {
    }


    _injectHTML() {
      let injectedHTML = `
        <div class="controls">
          <div>
            <select id="flexions">
              <option value="sic">as is</option>
              <option value="try">tr(?:y|ies|ied|ying)</option>
              <option value="tie">t(?:ie|ies|ied|ying)</option>
              <option value="tow">tow(?:s|ed|ing)?</option>
              <option value="owe">ow(?:e|es|ed|ing)</option>
              <option value="rot">rot(?:s|ted|ting)?</option>
              <option disabled>----</option>
              <option value="two">plural(?:s)?</option>
            </select
            ><button type="button" id="remove">-</button>
          </div>

          <div>
            <textarea id="addField" placeholder="Add expressions here"></textarea
            ><button type="button" id="addButton">+</button>
          </div>


          <button type="button" id="redraw">⌘</button>
          <button type="button" id="refresh">&#xe800;</button>

          <div>
            <div class="occurrences">
              <div>
                <p id="index">1</p
                ><p>—</p
                ><p id="total">2</p>
              </div>
              <div>
                <button type="button" id="up">&#xe804;</button>
                <button type="button" id="down">&#xe803;</button>
              </div>
            </div>

            <div class="expressions">
              <button type="button" id="back">&#xe802;</button
              ><button type="button" id="next">&#xe801;</button>
            </div>
          </div>
        </div>

        <div class="expression">
          <input type="text" id="regex"
          ><input type="checkbox" id="show-word"
          ><label for="show-word">;</label
          ><input type="text" id="word-look-up"
          ><input type="checkbox" id="show-image"
          ><label for="show-image">¡</label
          ><input type="text" id="image-look-up"
          ><input type="checkbox" id="show-flags"
          ><label for="show-flags">!</label
          ><div>
            <input type="text" id="flags"
            ><input type="text" id="level">
          </div>
        </div>

        <div class="flags">
          <select id="dictionary">
            <option value="cre">Cambridge Russian-English</option>
            <option value="D">Cambridge English</option>
            <option value="m">Merriam-Webster</option>
            <option value="none">-no dictionary-</option>
          </select>
          <select id="wiktionary">
            <option value="ru">Викисловарь</option>
            <option value="en">Wiktionary</option>
            <option value="none">-no wikitionary-</option>
          </select>
          <input type="checkbox" id="tatoeba">
          <label for="tatoeba">Tatoeba</label>
          <input type="checkbox" id="images">
          <label for="images">Images</label>
          <select id="wikipedia">
            <option value="ru">Википедия</option>
            <option value="en">Wikipedia</option>
            <option value="none">-no wikipedia-</option>
          </select>
        </div>
      `
      let teflRefPanel = document.createElement("div")
      teflRefPanel.id = "tefl-reference-panel"
      teflRefPanel.innerHTML = injectedHTML
      document.body.appendChild(teflRefPanel)
    }


    _initialize() {
      this.article = document.querySelector("article")
      this.panel = document.getElementById("tefl-reference-panel")

      this.flexions = document.getElementById("flexions")
      this.remove = document.getElementById("remove")
      this.addField = document.getElementById("addField")
      this.addButton = document.getElementById("addButton")
      this.redraw = document.getElementById("redraw")
      this.refresh = document.getElementById("refresh")
      this.index = document.getElementById("index")
      this.total = document.getElementById("total")
      this.upButton = document.getElementById("up")
      this.downButton = document.getElementById("down")
      this.nextButton = document.getElementById("next")
      this.backButton = document.getElementById("back")

      this.regexField = document.getElementById("regex")
      this.wordField = document.getElementById("word-look-up")
      this.imageField = document.getElementById("image-look-up")
      this.flagsField = document.getElementById("flags")
      this.levelField = document.getElementById("level")

      this.showWord = document.getElementById("show-word")
      this.showImage = document.getElementById("show-image")
      this.showFlags = document.getElementById("show-flags")

      this.dictionary = document.getElementById("dictionary")
      this.wiktionary = document.getElementById("wiktionary")
      this.tatoeba = document.getElementById("tatoeba")
      this.imageCheck = document.getElementById("images")
      this.wikipedia = document.getElementById("wikipedia")

      let listener = this.goExpression.bind(this)
      this.nextButton.addEventListener("mouseup", listener, false)
      this.backButton.addEventListener("mouseup", listener, false)

      listener = this.scrollToOccurrence.bind(this)
      this.upButton.addEventListener("mouseup", listener, false)
      this.downButton.addEventListener("mouseup", listener, false)

      listener = this.redrawAndExport.bind(this)
      this.redraw.addEventListener("mouseup", listener, false)

      listener = this.addNewWords.bind(this)
      this.addButton.addEventListener("mouseup", listener, false)

      listener = this.removeExpression.bind(this)
      this.remove.addEventListener("mouseup", listener, false)

      listener = this.newSelection.bind(this)
      this.panel.addEventListener("change", listener, false)
      // parseRegex is not identical to the linkRegex used in
      // markup.js _addSpansToHTML, because flag characters (:!¡°)
      // are wanted in  _launderExpressions and _generateExpression,
      // but not wanted in goExpression, so both options are provided
      this.parseRegex = /([^;¡!°]+)(;([^!¡°]*))?(¡([^!°]*))?(!([^!°]+))?(°(\d+))?/
      //mup.linkRegex = /([^;¡!°]+)(?:;([^!¡°]*))?(¡[^!°]*)?(![^°]+)?(?:°(\d+))?/

      this.article.classList.add("tefl-ref")
      this.htmlSpansReset()

      this.regex = ""
      this.regexString = ""
      this.wordLookUp = ""
      this.imageLookUp = ""
      this.flags = ""
      this.level = ""

      // this.expression
    }


    _showInputs(match) {

      // console.log(match)
      // 0: "expression;link¡image+link!Wit7"
      // 1: "expression"
      // 2: ";link"
      // 3: "link"
      // 4: "¡image+link"
      // 5: "image+link"
      // 6: "!Wit"
      // 7: "Wit"
      // 8: "7"
      // groups: undefined
      // index: 0
      // input: "expression;link¡image+link!Wit7"

      this.showWord.checked = !!(this.wordLookUp = match[3] || "")
      this.wordField.value = this.wordLookUp

      this.showImage.checked = !!(this.imageLookUp = match[5] || "")
      this.imageField.value = this.imageLookUp

      this.showFlags.checked = !!(this.flags = match[7] || "")
      this.flagsField.value = this.flags

      this.levelField.value = this.level = match[8]

      // And finally...
      this.regex = this._updateRegex((match[1]))
    }


    _showFlags() {
      let select = this.dictionary
      if (this.flags.indexOf("d") + 1) {
        select.value = "none"
      } else if (this.flags.indexOf("m") + 1) {
        select.value = "m"
      } else if (this.flags.indexOf("D") + 1) {
        select.value = "D"
      } else {
        select.value = "cre"
      }

      select = this.wiktionary
      if (this.flags.indexOf("w") + 1) {
        select.value = "none"
      } else if (this.flags.indexOf("W") + 1) {
        select.value = "en"
      } else {
        select.value = "ru"
      }

      select = this.wikipedia
      if (this.flags.indexOf("e") + 1) {
        select.value = "en"
      } else if (this.flags.indexOf("E") + 1) {
        select.value = "ru"
      } else {
        select.value = "none"
      }

      this.tatoeba.checked = (this.flags.indexOf("t") < 0)
      this.imageCheck.checked = (this.flags.indexOf("i") < 0)

      // console.log(match)
      // 0: "expression;link¡image+link!Wit7"
      // 1: "expression"
      // 2: ";link"
      // 3: "link"
      // 4: "¡image+link"
      // 5: "image+link"
      // 6: "!Wit"
      // 7: "Wit"
      // 8: "7"
      // groups: undefined
      // index: 0
      // input: "expression;link¡image+link!Wit7"
    }


    _showOccurrences() {
      this.occurrences = this.spans.filter((span) => {
        let isMatch = this.regex.test(span.innerText)
        if (isMatch) {
          span.classList.add("highlight")
        } else {
          span.classList.remove("highlight")
        }

        return isMatch
      })

      let length = this.occurrences.length
      this.total.innerText = length

      this._toggleScrollEnabled(length > 1)

      this.scrollToOccurrence()
    }


    _updateLookUp(field, value) {
      if (value) {
        this.flags = this[field].value
      } else {
        this.flags = ""
      }

      this._updateArray()
    }


    _updateDictionary(value) {
      switch (value) {
        case "cre":
          this._modifyFlags("", "dDm")
        break
        case "D":
          this._modifyFlags("D", "dm")
        break
        case "m":
          this._modifyFlags("m", "dD")
        break
        case "none":
          this._modifyFlags("d", "Dm")
        break
      }
    }


      // console.log(match)
      // 0: "expression;link¡image+link!Wit7"
      // 1: "expression"
      // 2: ";link"
      // 3: "link"
      // 4: "¡image+link"
      // 5: "image+link"
      // 6: "!Wit"
      // 7: "Wit"
      // 8: "7"
      // groups: undefined
      // index: 0
      // input: "expression;link¡image+link!Wit7"


    _updateWiktionary(value) {
      switch (value) {
        case "ru":
          this._modifyFlags("", "wW")
        break
        case "en":
          this._modifyFlags("W", "w")
        break
        case "none":
          this._modifyFlags("w", "W")
        break
      }
    }


    _updateTatoeba(value) {
      if (value) {
        this._modifyFlags("", "t")
      } else {
        this._modifyFlags("t", "")
      }
    }


    _updateImages(value) {
      if (value) {
        this._modifyFlags("", "i")
      } else {
        this._modifyFlags("i", "")
      }
    }


    _updateWikipedia(value) {
      switch (value) {
        case "ru":
          this._modifyFlags("E", "e")
        break
        case "en":
          this._modifyFlags("e", "E")
        break
        case "none":
          this._modifyFlags("", "eE")
        break
      }
    }


    _updateRegex(value) {
      let color = "#000"
      let bgColor = "#fff"
      let checkbox
        , regex
        , check

      try {
        check = this._tweakRegexString(value)
         if (value !== check) {
          if (check === "$^") {
            // value cannot be converted to a regular expression
            color = "#900"
            bgColor = "#fdd"
          } else {
            color = "#060"
            bgColor = "#efe"
          }

          value = check
        }
        
        regex = new RegExp("^" + value + "$", "i")

        this._updateField("regexString", value)

      } catch (error) {
        regex = /$^/ // no matches
        color = "#900"
        bgColor = "#fdd"
      }

      this.regexField.style.color = color
      this.regexField.style.backgroundColor = bgColor
      // this.regexString = value // already done in _updateField

      return regex
    }


    _tweakRegexString(regexString) {
      let index = -1

      // Ensure that any parentheses are non-capturing
      while ((index = regexString.indexOf("(", index + 1)) > -1) {
        if (regexString.indexOf("?:", index) !== index + 1) {
          regexString = regexString.splice(index + 1, 0, "?:")
        }
      }

      // Ensure alternatives are enclosed in a non-capturing group
      if (regexString.indexOf("|") > -1) {
        if (regexString.indexOf("(")) {// !== 0)
          regexString = "(?:" + regexString + ")"
        }
      }

      // Ensure the string can be converted to a regular expression
      try {
        let regex = new RegExp(regexString)

      } catch (error) {
        console.log("Invalid string for RegExp: " + regexString)
        regexString = "$^"
      }

      return regexString
    }


    _updateField(property, value) {
      let root = property.replace(/LookUp|String/, "") 
      let field = root + "Field"
      let checkbox = "show"+root[0].toUpperCase()+root.substring(1)

      this[property] = value
      this[field].value = value
      if (checkbox = this[checkbox]) {
        checkbox.checked = !!value
      }

      this._updateArray()
    }


    _modifyFlags(add, remove) {
      let char

      remove = remove.split("")
      while (char = remove.pop()) {
        this.flags = this.flags.replace(char, "")
      }

      this.flags += add

      this.flagsField.value = this.flags

      this.showFlags.checked = !!this.flags

      this._updateArray()
    }


    _applyFlexion(flexion) {
      let pattern
      let regex
      let replacement

      switch (flexion) {
        case "sic":
          pattern = ""
          regex = /$^/
        break
        case "try":
          pattern = "(?:y|ies|ied|ying)"
          regex = /(y|ies|ied|ying)\b/
        break
        case "tie":
          pattern = "(?:ie|ies|ied|ying)"
          regex = /(ie|ies|ied|ying)\b/
        break
        case "tow":
          pattern = "$1(?:s|ed|ing)?"
          regex = /([bcdfghjklmnprstvwxyz])(s|ed|ing)?\b/
        break
        case "owe":
          pattern = "(?:e|es|ed|ing)"
          regex = /(e|es|ed|ing)\b/
        break
        case "rot":
          pattern = "$1(?:s|$1ed|$1ing)?"
          regex = /([bdfglmnprst])(s|ed|ing)?\b/
        break
        case "two":
          pattern = "(?:s)?"
          regex = /$/
        break     
      }

      replacement = this.regexString.replace(regex, pattern)
      this._updateField("regexString", replacement)
    }


    _showFlexion() {
      let pattern = "sic"

      let regexString = "(\\(\\?:y\\|ies\\|ied\\|ying\\))"    // try
      regexString    += "|(\\(\\?:ie\\|ies\\|ied\\|ying\\))"  // tie
      regexString    += "|(\\(\\?:s\\|ed\\|ing\\)\\?)"        // tow
      regexString    += "|(\\(\\?:e\\|es\\|ed\\|ing\\))"      // owe
      regexString    += "|((.)\\(\\?:s\\|\\6ed\\|\\6ing\\)\?)"// rot
      regexString    += "|(\\(\\?:s\\)\\?)"                   // two

      let regex = new RegExp(regexString)
      let match = regex.exec(this.regexString)

      pattern = (match)
      ? match[1]
        ? "try"
        : match[2]
          ? "tie"
          : match[3]
            ? "tow"
            : match[4]
              ? "owe"
              : match[5]
                ? "rot"

                : match[7]
                  ? "two"
                  : (console.log("unexpected flexion"), "sic")
       : "sic"

      this.flexions.value = pattern
    }


    _toggleScrollEnabled(enabled) {
      this.upButton.disabled = this.downButton.disabled = !enabled
    }


    _generateExpression(expressionArray) {
      // console.log(expressionArray)

      // 0: "regex;link¡image link!flags70"
      // 1: "regex"
      // 2: ";link"        // <<< may have been corrected
      // 3: "link"
      // 4: "¡image+link"  // <<< may have been corrected
      // 5: "image link"
      // 6: "!flags"
      // 7: "flags"
      // 8: "<integer level>"

      let expression = expressionArray[1]
                     + (expressionArray[2] || "")
                     + (expressionArray[4] || "")
                     + (expressionArray[6] || "")
                     + (expressionArray[8] || "7")

      return expression
    }


    _orderByPosition(a, b) {
      let getPosition = (expression) => {
        let position = this.positions[expression]

        if (position === undefined) {
          let dataLink = this._getData(expression).link

          position = this.spans.findIndex((span) => {
            return span.dataset.link === dataLink
          })

          this.positions[expression] = position
        }

        return position
      }

      return getPosition(a) - getPosition(b)
    }


    _getData(expression) {
      let match = this.parseRegex.exec(expression)  

      // console.log(match)
      // 0: "expression;link¡image+link!Wit7"
      // 1: "expression"
      // 2: ";link"
      // 3: "link"
      // 4: "¡image+link"
      // 5: "image+link"
      // 6: "!Wit"
      // 7: "Wit"
      // 8: "7"
      // groups: undefined
      // index: 0
      // input: "expression;link¡image+link!Wit7"
      
      let term = match[1]
      let link = (match[3] || term) 
               + (match[4] || "")
               + (match[6] || "")

      return {
        term: term
      , link: link
      }
    }


    _updateArray() {
      let newItem = this.regexString

      if (this.showWord.checked && this.wordLookUp) {
        newItem += ";" + this.wordLookUp
      }

      if (this.showImage.checked && this.imageLookUp) {
        newItem += "¡" + this.imageLookUp
      }

      if (this.showFlags.checked && this.flags) {
        newItem += "!" + this.flags
      }

      newItem += this.level

      this.updatedArray[this.updatedArray.index] = newItem
      // console.log(newItem)
    }


    _showUpdatedArray() {
      let noChange = this.expressions.every((expression, index) => {
        return this.updatedArray[index] === expression
      })

      if (noChange) {
        noChange = this.updatedArray.every((expression, index) => {
          return this.expressions[index] === expression
        })
      }

      if (noChange) {
        return console.log("No changes made")
      } else {
        console.log(JSON.stringify(this.updatedArray))
      }
    }


    _requestWindowsUpdate() {
      let message = {
        subject: "windowsUpdate"
      , word: this.wordLookUp || this.regexString
      , image: this.imageLookUp || this.wordLookUp || this.regexString
      , flags: this.flags
      }

      // console.log (message)

      chrome.runtime.sendMessage(
        message
      , genericCallback
      )
    }
  }


  /// COMMUNICATION WITH EXTENSION // COMMUNICATION WITH EXTENSION ///


  function genericCallback() {
    console.log(...arguments)
  }


  function initializeExtension() {
    console.log("content.js: initializeExtension")

    chrome.runtime.onMessage.addListener(treatIncomingMessages)

    chrome.runtime.sendMessage (
      { subject: "showPageAction" }
    , genericCallback
    )
  }


  function treatIncomingMessages(request, sender, sendResponse) {
    let senderId = sender.id || "tab" + sender.tab.id
    console.log("Message received from " + senderId
              + ": " + JSON.stringify(request))

    let response = "(untreated)"
    let panel = chrome.teflRefPanel
    let method = panel
               ? panel[request.subject]// may be undefined
               : undefined             // pas de panel pas de chocolat

    switch (request.subject) {
      case "activateExtension":
        if (!panel) {
          panel = chrome.teflRefPanel = new TEFLRefPanel(expressions)
        }

        response = panel.getState()
      break

      default:
        if (method) {
          response = method.bind(panel)()
        }
    }

    console.log(response)
    sendResponse(response)
  }

})()