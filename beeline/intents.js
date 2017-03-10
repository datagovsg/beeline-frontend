const EventEmitter = require('events');

const taskQueue = new EventEmitter();

taskQueue.queue = [];

window.handleOpenURL = function (url) {
  taskQueue.queue.push(url);
  taskQueue.emit('newUrl')
}

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
