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

  /// <<< HARD-CODED
  var activeIconPath = "img/active.png" // { "16": <path> }
  /// HARD-CODED >>>


  var teflTabMap = {}


  class TEFLTab {
    constructor(urlData, tabCounter) {
      this.rootURL = urlData.url
      this.hash = urlData.hash || ""
      this.imageSearch = !!urlData.imageSearch
      this.flagsRegex = new RegExp(urlData.flag)

      this.tabCounter = tabCounter

      // this.tabId
    }


    createTab(options) {
      chrome.tabs.create(options, this.tabCreated.bind(this))
    }


    tabCreated(tabData) {
      this.tabId = tabData.id
      this.tabCounter[0] -= 1

      if (!this.tabCounter[0]) {
        this.tabCounter.callback()
      }
    }

  
    setURL(request) {
      let url = this.rootURL
              + (this.imageSearch
                ? request.image || request.word
                : request.word
                )
              + this.hash

      let callback = this.urlUpdated.bind(this)
      let selected = this.flagsRegex.test(request.flags)
      let options = {
        url: url
      , highlighted: selected
      }

      chrome.tabs.update( this.tabId, options, callback )

      return true
    }


    urlUpdated() {
      console.log("urlUpdated for " + this.tabId, ...arguments)
    }
  }



  class TEFLRefManager {
    constructor (tabId) {
      this.tabId = tabId
      this.tabInstances = []
      this.sites = {
        // dictionary: [
        //   { url: "https://dictionary.cambridge.org/dictionary/english-russian/"
        //   , flag: "^[^Dd]*$"
        //   }
        // , { url: "https://dictionary.cambridge.org/dictionary/english/"
        //   , flag: "D"
        //   }
        // , { url: "https://www.merriam-webster.com/dictionary/"
        //   , flag: "m"
        //   }
        // ]

        // , wiki: [
        //     { url: "https://ru.wiktionary.org/wiki/"
        //     , hash: "#Английский" 
        //     , flag: "^[^Ww]*$"
        //     }
        //   , { url: "https://en.wiktionary.org/wiki/"
        //     , flag: "W"
        //     }
        //   , { url: "https://en.wikipedia.org/wiki/"
        //     , flag: "e"
        //     }
        //   , { url: "https://ru.wikipedia.org/wiki/"
        //     , flag: "E"
        //     }
        //   ]

        // , tatoeba: [
        //     { url: "https://tatoeba.org/rus/sentences/search?from=eng&to=rus&query="
        //     , flag: "^[^Tt]*$"
        //     }
        // , ]

        // , images: [
        //     { url: "https://www.google.ru/search?tbm=isch&q="
        //     , imageSearch: true 
        //     , flag: "^[^Ii]*$"
        //     }
        // ]
      }

      chrome.tabs.sendMessage(
        this.tabId
      , "activateExtension"
      , this.extensionActivated.bind(this)
      )
    }


    tellClientThatAllIsReady(tabId) {
      if (!tabId) {
        tabId = this.tabId
      } else {
        chrome.tabs.sendMessage(tabId, "activateExtension")
      }

      chrome.tabs.sendMessage(tabId, "windowsCreated")
    }


    extensionActivated(response) {
      // console.log("extensionActivated", response)

      chrome.pageAction.setIcon({
        tabId: this.tabId
      , path: activeIconPath
      })

      this._openWindows()
    }


    updateWindows(request) {
      let success = this.tabInstances.every((tabInstance) => {
        return tabInstance.setURL(request)
      })

      return success
    }


    _openWindows() {
      let getTabCounter = (windowNames) => {
        let tabCounter = [0]
        tabCounter.callback = () => {
          this.tellClientThatAllIsReady.bind(this)
        }

        windowNames.forEach((windowName) => {
          let siteData = this.sites[windowName]
          tabCounter[0] += siteData.length
        })

        console.log("getTabCounter", tabCounter[0])

        return tabCounter
      }

      let openWindow = (windowName, index) => {

        let windowCreatedCallback = (windowData) => {

          let options = {
            windowId: windowData.id
          , active: false
          }

          let createTabInstance = (urlData, index) => {
            let tabInstance = new TEFLTab(urlData, tabCounter)
            this.tabInstances.push(tabInstance)

            if (!index) {
              tabInstance.tabCreated(windowData.tabs[0])

            } else {
              tabInstance.createTab(options)
            }
          }


          let siteData = this.sites[windowName]
          let url

          notify ("window opened", windowData)

          siteData.forEach(createTabInstance)
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
      let tabCounter = getTabCounter(windowNames)
      
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
      let instance = teflTabMap[Object.keys(teflTabMap)[0]]

      if (!instance) {
        instance = new TEFLRefManager(tabId)
      } else {
        instance.tellClientThatAllIsReady(tabId)
      }

      teflTabMap[tabId] = instance
    }
  }


  function updateWindows(request, sender) {
    let manager = teflTabMap[sender.tab.id]
    let response = manager.updateWindows(request)

    return response
  }


  function treatIncomingMessage(request, sender, sendResponse) {
    let response = "Message received: " + JSON.stringify(request)

    console.log("Incoming message from tab:" + sender.tab.url)

    switch (request.message) {
      case "showPageAction":
        showPageAction(sender.tab.id, request.value)
    
      break

      case "windowsUpdate": 
        response = updateWindows(request, sender)
      break
    }

    sendResponse(response)
  }


  chrome.pageAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatIncomingMessage)
})()