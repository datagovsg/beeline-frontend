
angular.module('beeline')
.factory('RotatedImage', function () {
  const WIDTH=300
  const HEIGHT=300
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT

  class RotatedImage {
    constructor(imgSource) {
      this.loaded = false
      this.image = new Image()
      this.image.src = imgSource
      this.imageLoadPromise = new Promise((resolve) => {
        this.image.onload = resolve
      })
      .then(() => {
        this.loaded = true
      })
    }

    rotate(radians) {
      if (!this.loaded) {
        return null
      }

      const ctx = canvas.getContext('2d')
      ctx.resetTransform()
      ctx.clearRect(0, 0, WIDTH, HEIGHT)

      ctx.translate(WIDTH / 2, HEIGHT / 2)
      ctx.rotate(radians)
      ctx.translate(-WIDTH / 2, -HEIGHT / 2)

      ctx.drawImage(this.image, 0, 0, WIDTH, HEIGHT)

      return canvas.toDataURL()
    }
  }

  return RotatedImage
})
