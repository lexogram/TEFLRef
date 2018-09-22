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


  var sites = {
    dictionary: {
      "0_enru": "https://dictionary.cambridge.org/dictionary/english-russian/word"
    , "1_en":   "https://dictionary.cambridge.org/dictionary/english/word"
    , "2_web":  "https://www.merriam-webster.com/dictionary/word"
    }
    
  , wiki: {
      "0_ru": "https://ru.wiktionary.org/wiki/word"
    , "1_en": "https://en.wiktionary.org/wiki/word"
    , "2_en": "https://en.wikipedia.org/wiki/word"
    , "3_ru": "https://ru.wikipedia.org/wiki/word"
    }
    
  , tatoeba: {
      "0_enru": "https://tatoeba.org/rus/sentences/search?from=eng&to=rus&query=word"
    }
  , images: {
      "0_en": "https://www.google.ru/search?tbm=isch&q=word"
    }
  }


  notify(sites, Object)


  function useExtension() {
    notify ("useExtension triggered")

    var windowNames = Object.keys(sites)

    windowNames.forEach(openWindow)
  }


  function openWindow(windowName, index) {
    var width = Math.max(521, (screen.availWidth) / 4)
    var leftEdge = screen.availWidth - (width * 2)
    var height = (screen.availHeight) / 2 // 528
    var chromeHeight = 30 // found by trial & error on Chrome/Ubuntu
    var toolBarHeight = screen.height - screen.availHeight
    var top = Math.floor(index / 2) * height
    var left = leftEdge + (index % 2) * width 

    var options = {
      left: left
    , top: top + toolBarHeight
    , width: width
    , height: height - chromeHeight
    , focused: false
    , type: "normal" // "popup" // 
    }

    chrome.windows.create(options, windowCreateCallback)

    function windowCreateCallback(window_data) {
      let siteData = sites[windowName]
      let siteKeys = Object.keys(siteData)
      let url

      notify ("window opened", window_data)

      let options = {
        windowId: window_data.id
      , active: false
      }

      siteKeys.forEach((siteKey, index) => {
        if (!index) {
          chrome.tabs.update(
            window_data.tabs[0].id
          , { url: siteData[siteKey] }
          )

        } else {
          options.url = siteData[siteKey]
          chrome.tabs.create(options, tabCreateCallback)
        }
      })
    }


    function tabCreateCallback(tab_data) {
      notify ("tab opened", tab_data)
    }
  }

  chrome.browserAction.onClicked.addListener(useExtension)
  notify ("Background script loaded")
})()