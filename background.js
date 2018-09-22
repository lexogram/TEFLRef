/** background.js **
 *
 * 
**/



"use strict"

;(function backgroundLoaded(){

  function notify() {
    console.log.apply(console, arguments)
    alert(arguments[0])
  }

  function useExtension() {
    notify ("useExtension triggered")

    var URL = chrome.extension.getURL("html/popup.html")
    var width = 300
    var top = 0

    var options = {
      url: URL
    , left: screen.availWidth - width
    , top: top
    , width: width
    , height: screen.availHeight - top
    , focused: false
    , type: "popup" // "normal"
    }

    chrome.windows.create(options, callback)

    function callback(window_data) {
      notify ("window opened", window_data)
    }
  }

  chrome.browserAction.onClicked.addListener(useExtension)
  notify ("Background script loaded")
})()