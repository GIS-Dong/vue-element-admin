import $ from 'jquery'
import qs from 'qs'

class QueryTask {
  constructor(layerOption) {
    this.layerOption = layerOption
  }

  execute(queryParameters) {
    const params = {
      service: 'wfs',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: this.layerOption.visibleLayers[0],
      outputFormat: queryParameters.outputFormat
    }
    if (queryParameters.tableName) {
      params.typeName = queryParameters.tableName
    }
    if (queryParameters.where) {
      params.CQL_FILTER = queryParameters.where
    }
    if (queryParameters.srsName) {
      params.srsName = queryParameters.srsName
    }
    if (queryParameters.startIndex) {
      params.startIndex = queryParameters.startIndex
    }
    if (queryParameters.maxFeatures) {
      params.maxFeatures = queryParameters.maxFeatures
    }
    if (queryParameters.resultType) {
      params.resultType = queryParameters.resultType
    }

    return new Promise((resolve, reject) => {
      const url = this.layerOption.identifyField[0].lyr + '/' + this.layerOption.visibleLayers[0].split(':')[0] + '/wfs'
      $.ajax({
        url: url,
        type: 'POST',
        data: qs.stringify(params),
        success: response => {
          resolve(response)
        },
        error: error => {
          reject(error)
        }
      })
    })
  }
}

export default QueryTask
