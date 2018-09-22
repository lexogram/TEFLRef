/** background.js **
 *
 *
**/



"use strict"

;(function backgroundLoaded(){

  function notify() {
    console.log.apply(console, arguments)
    // alert(arguments[0])
  }


  notify ("Background script loaded")

  var teflTabMap = {}
  /// <<< HARD-CODED
  var activeIconPath = "img/active.png" // { "16": <path> }
  /// HARD-CODED >>>


  class TEFLRefManager {
    constructor (tabId) {
      this.tabId = tabId
      this.tabIds = []
      this.sites = {
      //     dictionary: {
      //       "0_enru": "https://dictionary.cambridge.org/dictionary/english-russian/word"
      //     , "1_en":   "https://dictionary.cambridge.org/dictionary/english/word"
      //     , "2_web":  "https://www.merriam-webster.com/dictionary/word"
      //     }

      //   , wiki: {
      //       "0_ru": "https://ru.wiktionary.org/wiki/word"
      //     , "1_en": "https://en.wiktionary.org/wiki/word"
      //     , "2_en": "https://en.wikipedia.org/wiki/word"
      //     , "3_ru": "https://ru.wikipedia.org/wiki/word"
      //     }

      //   , tatoeba: {
      //       "0_enru": "https://tatoeba.org/rus/sentences/search?from=eng&to=rus&query=word"
      //     }
      //   ,
      //   images: {
      //     "0_en": "https://www.google.ru/search?tbm=isch&q=word"
      //   }
      }


      chrome.tabs.sendMessage(
        this.tabId
      , "activateExtension"
      , this.extensionActivated.bind(this)
      )
    }


    extensionActivated(response) {
      console.log("extensionActivated", response)

      chrome.pageAction.setIcon({
        tabId: this.tabId
      , path: activeIconPath
      })

      this._openWindows()
    }


    _openWindows() {
      let openWindow = (windowName, index) => {
        let windowCreatedCallback = (windowData) => {
          let siteData = this.sites[windowName]
          let siteKeys = Object.keys(siteData)
          let url

          notify ("window opened", windowData)

          let options = {
            windowId: windowData.id
          , active: false
          }

          siteKeys.forEach((siteKey, index) => {
            if (!index) {
              chrome.tabs.update(
                windowData.tabs[0].id
              , { url: siteData[siteKey] }
              )

            } else {
              options.url = siteData[siteKey]
              chrome.tabs.create(options, tabCreatedCallback)
            }
          })
        }


        let tabCreatedCallback = (tabData) => {
          notify ("tab created", tabData)
          this.tabIds.push(tabData.id)
          console.log(this.tabIds)
        }


        let width = Math.max(521, (screen.availWidth) / 4)
        let leftEdge = screen.availWidth - (width * 2)
        let height = (screen.availHeight) / 2 // 528
        let chromeHeight = 30 // found by trial & error on Chrome/Ubuntu
        let toolBarHeight = screen.height - screen.availHeight
        let top = Math.floor(index / 2) * height
        let left = leftEdge + (index % 2) * width

        let options = {
          left: left
        , top: top + toolBarHeight
        , width: width
        , height: height - chromeHeight
        , focused: false
        , type: "normal" // "popup" //
        }

        chrome.windows.create(options, windowCreatedCallback)
      }

      let windowNames = Object.keys(this.sites)
      windowNames.forEach(openWindow)
    }
  }


  function showPageAction(tabId, boolean) {
    if (boolean) {
      chrome.pageAction.show(tabId)
    }
  }


  function useExtension(args) {
    notify ("useExtension triggered", args)

    let options = { active: true, currentWindow: true }

    // Activate TEFL Reference Panel in content page
    chrome.tabs.query(
      options
    , activateExtension
    )


    function activateExtension(tabs) {
      let tabId = tabs[0].id
      teflTabMap[tabId] = new TEFLRefManager(tabId)
    }
  }


  function treatIncomingMessage(request, sender, sendResponse) {
    let response = "Message received: " + JSON.stringify(request)

    console.log("Incoming message from tab:" + sender.tab.url)

    switch (request.message) {
      case "showPageAction": {
        showPageAction(sender.tab.id, request.value)
      }
    }

    sendResponse(response)
  }


  chrome.pageAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatIncomingMessage)
})()