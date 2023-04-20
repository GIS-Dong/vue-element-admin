import { Circle as CircleStyle, Stroke, Style } from 'ol/style.js'
import { easeOut } from 'ol/easing.js'

/**
 * WFS图层选中闪烁动画效果
 * @param {import('ol/interaction/Select').default} select 地图选择事件
 * @param {number} duration 一次动画的时间
 */
function flash(select, duration = 3000) {
  const layer = select.getOverlay()
  layer.on('postcompose', animate)

  function animate(event) {
    layer
      .getSource()
      .getFeatures()
      .forEach(feature => {
        let start = feature.get('ol-animate-start-time')
        if (!start) {
          start = new Date().getTime()
          feature.set('ol-animate-start-time', start)
        }
        const vectorContext = event.vectorContext
        const frameState = event.frameState
        const flashGeom = feature.getGeometry().clone()
        const elapsed = frameState.time - start
        const elapsedRatio = elapsed / duration
        // radius 在开始时为5，在结束时为30.
        const radius = easeOut(elapsedRatio) * 25 + 5
        const opacity = easeOut(1 - elapsedRatio)

        const style = new Style({
          image: new CircleStyle({
            radius: radius,
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, ' + opacity + ')',
              width: 0.25 + opacity
            })
          })
        })

        vectorContext.setStyle(style)
        vectorContext.drawGeometry(flashGeom)
        if (elapsed > duration) {
          // 一次动画效果结束后，重置时间，开始下一次动画
          feature.set('ol-animate-start-time', new Date().getTime())
        }
        // 继续触发图层postcompose事件
        layer.getSource().refresh()
      })
  }
}

export default flash
