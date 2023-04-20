import { Circle as CircleStyle, Style } from 'ol/style.js'
import { linear } from 'ol/easing.js'

/**
 * 选中跳动动画效果
 * @param {import('ol/interaction/Select').default} select 地图选择事件
 * @param {number} options.times 一次动画的跳动次数
 * @param {number} options.amplitude 跳动幅度
 * @param {number} options.duration 一次动画的时间
 */
function bounce(select, options) {
  options = options || {}
  const times = -Math.PI * (options.times || 3)
  const amplitude = options.amplitude || 40
  const duration = options.duration || 1000
  const layer = select.getOverlay()
  // ol/interaction/Select 的样式
  const style = layer.getStyle()
  // 移除选中时，取消feature的样式
  select.on('select', e => {
    e.deselected.forEach(feature => {
      feature.setStyle(null)
    })
  })
  // 手动删除select的feature时，恢复feature样式
  select.getFeatures().on('remove', evt => {
    evt.element.setStyle(null)
  })
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
        const jumpGeom = feature.getGeometry().clone()
        let elapsed = (frameState.time - start) / duration
        if (elapsed > 1) {
          elapsed = 1
        }

        const deltaY =
          Math.abs(Math.sin(times * elapsed)) * amplitude * (1 - linear(elapsed)) * frameState.viewState.resolution
        jumpGeom.translate(0, deltaY)
        feature.setStyle(
          new Style({
            image: new CircleStyle({})
          })
        )
        let featureStyle
        // 适用select Interaction的样式
        if (typeof style === 'function') {
          featureStyle = style(feature)
        } else {
          featureStyle = style
        }
        vectorContext.setStyle(featureStyle)
        vectorContext.drawGeometry(jumpGeom)
        if (frameState.time - start > duration) {
          // 一次动画效果结束后，重置时间，开始下一次动画
          feature.set('ol-animate-start-time', new Date().getTime())
        }
        // 继续触发图层postcompose事件
        layer.getSource().refresh()
      })
  }
}

export default bounce
