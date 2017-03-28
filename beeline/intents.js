const EventEmitter = require('events');

const taskQueue = new EventEmitter();

taskQueue.queue = [];

window.handleOpenURL = function (url) {
  taskQueue.queue.push(url);
  taskQueue.emit('newUrl')
}

// Universal links for iOS
var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },

  // Bind Event Listeners
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  // deviceready Event Handler
  onDeviceReady: function() {
    universalLinks.subscribe(null, app.didLaunchAppFromLink);
  },

  didLaunchAppFromLink: function(eventData) {
    taskQueue.queue.push(eventData.url);
    taskQueue.emit('newUrl');
  }
};

app.initialize();

angular.module('beeline')
.run(function () {
  function handleUrl() {
    if (taskQueue.queue.length == 0) return;

    const lastUrl = taskQueue.queue[taskQueue.queue.length - 1];

    taskQueue.queue = [];

    let matches = lastUrl.match(/^[^#]+#(.*)$/)

    if (matches && matches[1]) {
      window.location.href='#' + matches[1]
    }
  }

  handleUrl();
  taskQueue.on('newUrl', handleUrl);
})
