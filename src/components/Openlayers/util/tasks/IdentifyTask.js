import $ from 'jquery'
import ImageLayer from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'

class IdentifyTask {
  constructor(layer) {
    this.layerOption = layer.get('option')
  }

  execute(identifyParameters) {
    const map = identifyParameters.map
    let layer = map.getLayerByLayerTag(this.layerOption.layerTag)
    if (!layer || layer.get('type') !== 'geoserver-wms') {
      layer = new ImageLayer({
        source: new ImageWMS({
          url: this.layerOption.url + '/wms',
          params: {
            LAYERS: this.layerOption.visibleLayers,
            VERSION: '1.1.0'
          }
        })
      })
    }

    const source = layer.getSource()
    const url = source.getGetFeatureInfoUrl(
      identifyParameters.coordinate,
      identifyParameters.resolution,
      identifyParameters.projection,
      identifyParameters.params
    )

    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        type: 'GET',
        success: response => {
          if (response.features && response.features.length > 0) {
            const result = {
              layerLabel: this.layerOption.label,
              layerId: this.layerOption.id,
              layerTag: this.layerOption.layerTag,
              feature: response.features[0]
            }
            resolve(result)
          } else {
            resolve()
          }
        },
        error: error => {
          reject(error)
        }
      })
    })
  }
}

export default IdentifyTask
