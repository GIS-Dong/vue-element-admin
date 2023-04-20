import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import vehicle from '../../assets/images/vehicle.gif'
import TrackEvent from './event/TrackEvent'
import { getCenter } from 'ol/extent'
import { Style, Icon } from 'ol/style.js'

class TrackPlayback {
  constructor(map, track, trackTimeKey, icon) {
    this.map = map
    // 当前状态
    this.status = undefined
    // 轨迹数据(GeoJSON)
    this.track = track
    // 轨迹数据中，表示时间信息的字段
    this.trackTimeKey = trackTimeKey || 'time'
    // 轨迹图标
    this.icon = icon || vehicle
    // 轨迹数据转成feature
    this.features = undefined
    // 轨迹线
    this.trackLine = undefined
    // 当前回放点的序号
    this.playingNumber = 0
    // 回放feature
    this.playingFeature = undefined
    // 回放速度
    this.playingSpeed = 100
    // 居中回放
    this.centerPlayback = false
    // 回放任务
    this.timeoutId = undefined
    this.registEvent()
    this.init()
  }

  registEvent() {
    // 事件监听
    this.map.on('timeBar_playStatus', evt => {
      if (evt.data.toLowerCase() === 'pause') {
        clearTimeout(this.timeoutId)
      } else if (evt.data.toLowerCase() === 'play') {
        if (this.status === 'stop') {
          this.init()
          this.start()
        } else {
          setTimeout(this.executeTask.bind(this), 500)
        }
      } else if (evt.data.toLowerCase() === 'stop') {
        this.reset()
      }
      this.status = evt.data.toLowerCase()
    })
  }

  init() {
    const geojsonFormat = new GeoJSON()
    this.features = geojsonFormat.readFeatures(this.track)
    this.trackLine = new Feature({
      geometry: new LineString([])
    })
    this.features.forEach(feature => {
      this.trackLine.getGeometry().appendCoordinate(feature.getGeometry().getCoordinates())
    })
    this.map
      .getLayerById('trackLayer')
      .getSource()
      .addFeature(this.trackLine)
    const extent = this.trackLine.getGeometry().getExtent()
    const timeInfo = {
      start: this.features[0].get(this.trackTimeKey),
      end: this.features[this.features.length - 1].get(this.trackTimeKey)
    }
    this.map.getView().animate(
      {
        center: getCenter(extent),
        resolution: this.map.getView().getResolutionForExtent(extent)
      },
      () => {
        this.map.dispatchEvent(new TrackEvent('trackPlayback_ready', timeInfo))
      }
    )
  }

  start() {
    this.timeoutId = setTimeout(this.executeTask.bind(this), 1500)
    if (!this.status) {
      this.map.dispatchEvent(new TrackEvent('trackPlayback_start'))
    }
  }

  executeTask() {
    if (this.playingNumber === 0) {
      const curGeomerty = this.features[this.playingNumber].getGeometry()
      const rotation = (this.features[this.playingNumber].get('direction') * Math.PI) / 180
      this.drawFeature = new Feature({
        geometry: curGeomerty
      })
      this.drawFeature.setStyle(
        new Style({
          image: new Icon({
            size: [32, 32],
            src: this.icon,
            anchor: [0.5, 0],
            rotation: rotation
          })
        })
      )
      this.playingNumber++
      this.map
        .getLayerById('trackLayer')
        .getSource()
        .addFeature(this.drawFeature)
      if (this.centerPlayback) {
        this.map.getView().animate({
          center: curGeomerty.getCoordinates(),
          duration: this.playingSpeed
        })
      }
      this.timeoutId = setTimeout(this.executeTask.bind(this), this.playingSpeed)
      this.map.dispatchEvent(new TrackEvent('trackPlayback_process', this.playingNumber / this.features.length))
    } else if (this.features.length > this.playingNumber) {
      const curGeomerty = this.features[this.playingNumber].getGeometry()
      const rotation = (this.features[this.playingNumber].get('direction') * Math.PI) / 180
      this.drawFeature.setGeometry(curGeomerty)
      this.drawFeature
        .getStyle()
        .getImage()
        .setRotation(rotation)
      if (this.centerPlayback) {
        this.map.getView().animate({
          center: curGeomerty.getCoordinates(),
          duration: this.playingSpeed
        })
      }
      this.playingNumber++
      this.timeoutId = setTimeout(this.executeTask.bind(this), this.playingSpeed)
      this.map.dispatchEvent(new TrackEvent('trackPlayback_process', this.playingNumber / this.features.length))
    } else {
      clearTimeout(this.timeoutId)
      this.map.dispatchEvent(new TrackEvent('trackPlayback_end'))
    }
  }

  reset() {
    clearTimeout(this.timeoutId)
    this.map
      .getLayerById('trackLayer')
      .getSource()
      .clear()
    this.playingNumber = 0
  }
}

export default TrackPlayback
