import Interaction from 'ol/interaction/Interaction.js'
import MapBrowserEventType from 'ol/MapBrowserEventType.js'
import IdentifyTask from '../../util/tasks/IdentifyTask'
import IdentifyParameters from '../../util/tasks/IdentifyParameters'
import { getUid } from 'ol/util.js'
import { clear } from 'ol/obj.js'
import { includes } from 'ol/array.js'
import { TRUE } from 'ol/functions.js'
import GeoJSON from 'ol/format/GeoJSON'
import IdentifyEvent from './IdentifyEvent'

/**
 * @enum {string}
 */
const IdentifyedEventType = {
  /**
   * 当查询到WMS feature时触发该事件.
   * @event IdentifyedEvent#Identifyed
   * @api
   */
  IDENTIFY: 'identify'
}

class Identify extends Interaction {
  constructor(options) {
    super({
      handleEvent: handleEvent
    })
    options = Object.assign({}, options)
    this.layerFilter = undefined
    if (options.layers) {
      if (typeof options.layers === 'function') {
        this.layerFilter = options.layers
      } else {
        const layers = options.layers
        this.layerFilter = function(layer) {
          return includes(layers, layer)
        }
      }
    } else {
      this.layerFilter = TRUE
    }
    /**
     * 选定要素(key)和图层(value)之间的关联
     * @private
     * @type {Object<string, import("../layer/Layer.js").default>}
     */
    this.featureLayerAssociation_ = {}
  }

  addFeatureLayerAssociation_(feature, layer) {
    this.featureLayerAssociation_[getUid(feature)] = layer
  }
}

function handleEvent(mapBrowserEvent) {
  let stopEvent = false
  if (mapBrowserEvent.type === MapBrowserEventType.CLICK) {
    clear(this.featureLayerAssociation_)
    const identifyTasks = []
    const map = mapBrowserEvent.map
    map.getViewport().style.cursor = 'wait'
    const layers = map.getLayers()
    layers.forEach(layer => {
      if (layer.get('type') && layer.get('type').split('-')[0] === 'geoserver') {
        if (this.layerFilter(layer)) {
          const identifyTask = new IdentifyTask(layer)
          const params = new IdentifyParameters(map)
          params.coordinate = map.getCoordinateFromPixel(mapBrowserEvent.pixel)
          identifyTasks.push(identifyTask.execute(params))
        }
      }
    })

    if (identifyTasks.length > 0) {
      Promise.all(identifyTasks)
        .then(result => {
          map.getViewport().style.cursor = 'auto'
          const identifyed = []
          result.forEach(featureInfo => {
            if (featureInfo) {
              const geojsonFormat = new GeoJSON()
              const feature = geojsonFormat.readFeature(featureInfo.feature)
              identifyed.push(feature)
              this.addFeatureLayerAssociation_(feature, map.getLayerById(featureInfo.layerId))
            }
          })
          this.dispatchEvent(new IdentifyEvent(IdentifyedEventType.IDENTIFY, identifyed, mapBrowserEvent))
        })
        .catch(error => {
          map.getViewport().style.cursor = 'auto'
          console.error(error)
        })
    } else {
      map.getViewport().style.cursor = 'auto'
    }

    mapBrowserEvent.preventDefault()
    stopEvent = true
  }
  return !stopEvent
}
export default Identify
