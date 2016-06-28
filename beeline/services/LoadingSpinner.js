import loadingTemplate from '../templates/loading.html';

export default function($ionicLoading) {
  var count = 0;

  function hide() {
    count = Math.max(0, count - 1);
    if (count === 0) {
      $ionicLoading.hide();
    }
  }
  function show() {
    if (count === 0) {
      $ionicLoading.show({template: loadingTemplate});
    }
    count = count + 1;
  }

  return function (p) {
    show()

    p.then(hide, hide)
  }
  hide()
}
