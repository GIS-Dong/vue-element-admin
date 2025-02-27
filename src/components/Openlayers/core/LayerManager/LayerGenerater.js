import $ from 'jquery'
import { Tile as TileLayer, Vector as VectorLayer, Image as ImageLayer } from 'ol/layer.js'
import {
  Vector as VectorSource,
  ImageWMS as ImageWMSSouece,
  XYZ as XYZSource,
  WMTS as WMTSSource,
  ImageArcGISRest,
  Cluster,
  TileImage
} from 'ol/source.js'
import { optionsFromCapabilities } from 'ol/source/WMTS.js'
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js'
import WMSCapabilities from 'ol/format/WMSCapabilities.js'
import VectorTileLayer from 'ol/layer/VectorTile.js'
import VectorTileSource from 'ol/source/VectorTile.js'
import TileGrid from 'ol/tilegrid/TileGrid'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { createXYZ } from 'ol/tilegrid.js'
import TileLayerA from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'

import MVT from 'ol/format/MVT.js'
import { transformExtent } from 'ol/proj'
import { newGuid } from '../../util/common'
import { getWidth, getTopLeft, applyTransform } from 'ol/extent'
import EsriJSON from 'ol/format/EsriJSON'
import GeoJSON from 'ol/format/GeoJSON.js'
import GML3 from 'ol/format/GML3'
import { tile as tileStrategy, bbox as bboxStrategy } from 'ol/loadingstrategy.js'
// import { find } from 'ol/array.js'

import { equalTo as EqualToFilter, and as AndFilter, or as OrFilter } from 'ol/format/filter.js'
import { WFS } from 'ol/format.js'
import { Projection, addProjection, addCoordinateTransforms, get } from 'ol/proj'
import projzh from 'projzh/index'

var forEachPoint = function(func) {
  return function(input, opt_output, opt_dimension) {
    var len = input.length
    var dimension = opt_dimension || 2
    var output
    if (opt_output) {
      output = opt_output
    } else {
      if (dimension !== 2) {
        output = input.slice()
      } else {
        output = new Array(len)
      }
    }
    for (var offset = 0; offset < len; offset += dimension) {
      func(input, output, offset)
    }
    return output
  }
}
var gcj02 = {}
var i = 0
var PI = Math.PI
var AXIS = 6378245.0
var OFFSET = 0.00669342162296594323 // (a^2 - b^2) / a^2

function delta(wgLon, wgLat) {
  var dLat = transformLat(wgLon - 105.0, wgLat - 35.0)
  var dLon = transformLon(wgLon - 105.0, wgLat - 35.0)
  var radLat = (wgLat / 180.0) * PI
  var magic = Math.sin(radLat)
  magic = 1 - OFFSET * magic * magic
  var sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI)
  dLon = (dLon * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI)
  return [dLon, dLat]
}

function outOfChina(lon, lat) {
  if (lon < 72.004 || lon > 137.8347) {
    return true
  }
  if (lat < 0.8293 || lat > 55.8271) {
    return true
  }
  return false
}

function transformLat(x, y) {
  var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLon(x, y) {
  var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

gcj02.toWGS84 = forEachPoint(function(input, output, offset) {
  var lng = input[offset]
  var lat = input[offset + 1]
  if (!outOfChina(lng, lat)) {
    var deltaD = delta(lng, lat)
    lng = lng - deltaD[0]
    lat = lat - deltaD[1]
  }
  output[offset] = lng
  output[offset + 1] = lat
})

gcj02.fromWGS84 = forEachPoint(function(input, output, offset) {
  var lng = input[offset]
  var lat = input[offset + 1]
  if (!outOfChina(lng, lat)) {
    var deltaD = delta(lng, lat)
    lng = lng + deltaD[0]
    lat = lat + deltaD[1]
  }
  output[offset] = lng
  output[offset + 1] = lat
})

var sphericalMercator = {}

var RADIUS = 6378137
var MAX_LATITUDE = 85.0511287798
var RAD_PER_DEG = Math.PI / 180

sphericalMercator.forward = forEachPoint(function(input, output, offset) {
  var lat = Math.max(Math.min(MAX_LATITUDE, input[offset + 1]), -MAX_LATITUDE)
  var sin = Math.sin(lat * RAD_PER_DEG)

  output[offset] = RADIUS * input[offset] * RAD_PER_DEG
  output[offset + 1] = (RADIUS * Math.log((1 + sin) / (1 - sin))) / 2
})

sphericalMercator.inverse = forEachPoint(function(input, output, offset) {
  output[offset] = input[offset] / RADIUS / RAD_PER_DEG
  output[offset + 1] = (2 * Math.atan(Math.exp(input[offset + 1] / RADIUS)) - Math.PI / 2) / RAD_PER_DEG
})

// var projzh = {}
projzh.ll2gmerc = function(input, opt_output, opt_dimension) {
  const output = gcj02.fromWGS84(input, opt_output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}
projzh.gmerc2ll = function(input, opt_output, opt_dimension) {
  const output = projzh.smerc2ll(input, input, opt_dimension)
  return gcj02.toWGS84(output, opt_output, opt_dimension)
}
projzh.smerc2gmerc = function(input, opt_output, opt_dimension) {
  let output = projzh.smerc2ll(input, input, opt_dimension)
  output = gcj02.fromWGS84(output, output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}
projzh.gmerc2smerc = function(input, opt_output, opt_dimension) {
  let output = projzh.smerc2ll(input, input, opt_dimension)
  output = gcj02.toWGS84(output, output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}

projzh.ll2smerc = sphericalMercator.forward
projzh.smerc2ll = sphericalMercator.inverse

const gcj02Extent = [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
const gcjMecator = new Projection({
  code: 'GCJ-02',
  extent: gcj02Extent,
  units: 'm'
})
addProjection(gcjMecator)
addCoordinateTransforms('EPSG:4326', gcjMecator, projzh.ll2gmerc, projzh.gmerc2ll)
addCoordinateTransforms('EPSG:3857', gcjMecator, projzh.smerc2gmerc, projzh.gmerc2smerc)

class LayerGenerater {
  constructor(map, layerStyles) {
    this.map = map
    this.layerStyles = layerStyles || []
  }

  generate(data) {
    if (data.type === 'tiled') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?f=json',
          type: 'GET',
          dataType: 'json',
          success: response => {
            const json = response
            const initExtent = []
            const extent = []
            const origin = []
            const resolutions = []
            const tileSize = []
            const projCode =
              'EPSG:' +
              (json.fullExtent.spatialReference.wkid === 102100 ? 3857 : json.fullExtent.spatialReference.wkid)

            origin.push(json.tileInfo.origin.x, json.tileInfo.origin.y)
            extent.push(json.fullExtent.xmin, json.fullExtent.ymin, json.fullExtent.xmax, json.fullExtent.ymax)
            initExtent.push(
              json.initialExtent.xmin,
              json.initialExtent.ymin,
              json.initialExtent.xmax,
              json.initialExtent.ymax
            )
            tileSize.push(json.tileInfo.rows, json.tileInfo.cols)
            for (let i = 0, l = json.tileInfo.lods.length; i < l; i++) {
              resolutions.push(json.tileInfo.lods[i].resolution)
            }
            const options = {
              projCode: projCode,
              origin: origin,
              initExtent: initExtent,
              extent: extent,
              resolutions: resolutions,
              tileSize: tileSize,
              extUrl: '/tile/{z}/{y}/{x}'
            }
            const layer = this.createArcGISTileLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'geoserver-vectorTiled') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url,
          type: 'GET',
          success: response => {
            const extent = []
            const origin = []
            const resolutions = []
            const tileSize = []
            let extUrl = ''
            const xml = response
            const srs = xml.getElementsByTagName('SRS')
            const projCode = srs[0].innerHTML
            const boundingBox = xml.getElementsByTagName('BoundingBox')
            // ！！！openlayers默认为左上角原点，geoserver提供的为左下角原点,故在这里原点不采用Origin节点的值
            // let originEle = xml.getElementsByTagName("Origin");
            origin.push(
              Number(boundingBox[0].attributes[0].nodeValue),
              Number(boundingBox[0].attributes[boundingBox[0].attributes.length - 1].nodeValue)
            )

            for (let i = 0, l = boundingBox[0].attributes.length; i < l; i++) {
              extent.push(Number(boundingBox[0].attributes[i].nodeValue))
            }
            const tileSets = xml.getElementsByTagName('TileSets')
            for (let i = 0, l = tileSets[0].children.length; i < l; i++) {
              resolutions.push(Number(tileSets[0].children[i].attributes[1].nodeValue))
            }
            const tileFormat = xml.getElementsByTagName('TileFormat')
            tileSize.push(Number(tileFormat[0].attributes[0].nodeValue), Number(tileFormat[0].attributes[1].nodeValue))
            const index = data.url.lastIndexOf('@')
            extUrl = '/{z}/{x}/{-y}.' + data.url.substring(index + 1, data.url.length)
            const options = {
              projCode: projCode,
              origin: origin,
              initExtent: extent,
              extent: extent,
              resolutions: resolutions,
              tileSize: tileSize,
              extUrl: extUrl
            }
            const layer = this.createGeoServerVectorTileLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'geoserver-tms') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url,
          type: 'GET',
          success: response => {
            const extent = []
            const resolutions = []
            const tileSize = []
            let extUrl = ''
            const xml = response
            const srs = xml.getElementsByTagName('SRS')
            const projCode = srs[0].innerHTML
            const boundingBox = xml.getElementsByTagName('BoundingBox')

            for (let i = 0, l = boundingBox[0].attributes.length; i < l; i++) {
              extent.push(Number(boundingBox[0].attributes[i].nodeValue))
            }
            const tileSets = xml.getElementsByTagName('TileSets')
            for (let i = 0, l = tileSets[0].children.length; i < l; i++) {
              resolutions.push(Number(tileSets[0].children[i].attributes[1].nodeValue))
            }
            const tileFormat = xml.getElementsByTagName('TileFormat')
            tileSize.push(Number(tileFormat[0].attributes[0].nodeValue), Number(tileFormat[0].attributes[1].nodeValue))

            extUrl = '/{z}/{x}/{-y}.' + data.url.substring(data.url.lastIndexOf('@') + 1, data.url.length)
            const options = {
              projCode: projCode,
              initExtent: extent,
              extent: extent,
              resolutions: resolutions,
              tileSize: tileSize,
              extUrl: extUrl
            }
            const layer = this.createGeoServerTMSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'arcgis-wms') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?services=WMS&Request=getCapabilities',
          type: 'GET',
          success: response => {
            const parser = new WMSCapabilities()
            const result = parser.read(response)
            const layers = result['Capability']['Layer']['Layer']
            // const targetLayer = find(layers, function(elt) {
            //   return elt['Name'] === data.visibleLayers[0]
            // })
            const targetLayer = layers.find((elt) => {
              return elt['Identifier'] === data.visibleLayers[0]
            })
            const initExtent = targetLayer['BoundingBox'][0].extent
            const options = {
              initExtent: initExtent
            }
            const layer = this.createImageWMSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'geoserver-wms') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '/wms?Request=getCapabilities',
          type: 'GET',
          success: response => {
            const parser = new WMSCapabilities()
            const result = parser.read(response)
            const layers = result['Capability']['Layer']['Layer']
            // const targetLayer = find(layers, function(elt) {
            //   return elt['Name'] === data.visibleLayers[0]
            // })
            const targetLayer = layers.find((elt) => {
              return elt['Identifier'] === data.visibleLayers[0]
            })
            const initExtent = targetLayer['BoundingBox'][0].extent
            const options = {
              initExtent: initExtent
            }
            const layer = this.createImageWMSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'tdt') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url:
            data.url +
            (data.url.indexOf('?') === -1 ? '?' : '&') +
            'SERVICE=WMTS&Request=getCapabilities&version=1.0.0' +
            newGuid(),
          type: 'GET',
          success: response => {
            const options = {
              CapabilitiesXml: response
            }
            const layer = this.createTDTLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'tdt_zj') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url:
            data.url +
            (data.url.indexOf('?') === -1 ? '?' : '&') +
            'SERVICE=WMTS&Request=getCapabilities&version=1.0.0',
          type: 'GET',
          success: response => {
            const options = {
              CapabilitiesXml: response
            }
            const layer = this.createTDTZJLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'tdt_offLine') {
      return new Promise(resolve => {
        const layer = this.createTDTLayer_offLine(data)
        resolve(layer)
      })
    } else if (data.type === 'dynamic') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?f=json',
          type: 'GET',
          success: response => {
            const json = typeof response === 'string' ? JSON.parse(response) : response
            const initExtent = []
            const projCode = 'EPSG:' + json.fullExtent.spatialReference.wkid
            initExtent.push(json.fullExtent.xmin, json.fullExtent.ymin, json.fullExtent.xmax, json.fullExtent.ymax)

            const options = {
              projCode: projCode,
              initExtent: transformExtent(initExtent, projCode, 'EPSG:4326')
            }
            const layer = this.createArcGISDynamicLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'feature') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?f=json',
          type: 'GET',
          success: response => {
            const json = response
            const initExtent = []
            const projCode = 'EPSG:' + json.initialExtent.spatialReference.wkid
            initExtent.push(
              json.initialExtent.xmin,
              json.initialExtent.ymin,
              json.initialExtent.xmax,
              json.initialExtent.ymax
            )

            const options = {
              projCode: projCode,
              initExtent: transformExtent(initExtent, projCode, 'EPSG:4326')
            }
            const layer = this.createArcGISFeatureLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'geoserver-wfs') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '/wfs?Request=getCapabilities',
          type: 'GET',
          success: response => {
            const layers = response.getElementsByTagName('FeatureTypeList')[0].children
            let targetLayer
            for (let i = 0, l = layers.length; i < l; i++) {
              for (let j = 0, ll = layers[i].children.length; j < ll; j++) {
                if (
                  layers[i].children[j].nodeName === 'Name' &&
                  layers[i].children[j].innerHTML === data.visibleLayers[0]
                ) {
                  targetLayer = layers[i]
                  break
                }
              }
              if (targetLayer) {
                break
              }
            }
            let initExtent = []
            for (let i = 0, l = targetLayer.children.length; i < l; i++) {
              if (targetLayer.children[i].nodeName === 'ows:WGS84BoundingBox') {
                const lowercorner = targetLayer.children[i].children[0].innerHTML.split(' ')
                const uppercorner = targetLayer.children[i].children[1].innerHTML.split(' ')
                initExtent = [
                  Number(lowercorner[0]),
                  Number(lowercorner[1]),
                  Number(uppercorner[0]),
                  Number(uppercorner[1])
                ]
                break
              }
            }
            const options = {
              initExtent: initExtent
            }
            const layer = this.createGeoServerWFSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'wmts' || data.type === 'geoserver-wmts') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?SERVICE=WMTS&Request=getCapabilities&version=1.0.0',
          type: 'GET',
          success: response => {
            const options = {
              CapabilitiesXml: response
            }
            const layer = this.createWMTSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'arcgis-wfs') {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: data.url + '?services=WFS&Request=getCapabilities',
          type: 'GET',
          success: response => {
            const xml = response
            const layers = xml.getElementsByTagName('wfs:FeatureTypeList')[0].children
            let targetLayer
            for (let i = 0, l = layers.length; i < l; i++) {
              for (let j = 0, ll = layers[i].children.length; j < ll; j++) {
                if (
                  layers[i].children[j].nodeName === 'wfs:Name' &&
                  layers[i].children[j].innerHTML === data.visibleLayers[0]
                ) {
                  targetLayer = layers[i]
                  break
                }
              }
              if (targetLayer) {
                break
              }
            }
            let initExtent = []
            for (let i = 0, l = targetLayer.children.length; i < l; i++) {
              if (targetLayer.children[i].nodeName === 'ows:WGS84BoundingBox') {
                const lowercorner = targetLayer.children[i].children[0].innerHTML.split(' ')
                const uppercorner = targetLayer.children[i].children[1].innerHTML.split(' ')
                initExtent = [
                  Number(lowercorner[0]),
                  Number(lowercorner[1]),
                  Number(uppercorner[0]),
                  Number(uppercorner[1])
                ]
                break
              }
            }
            const options = {
              initExtent: initExtent
            }
            const layer = this.createArcGISWFSLayer(data, options)
            resolve(layer)
          },
          error: error => {
            console.error(error)
            reject(new Error('图层' + '"' + data.label + '"' + '加载失败,请检查配置是否正确!'))
          }
        })
      })
    } else if (data.type === 'BaiduMap') {
      return new Promise(resolve => {
        // eslint-disable-next-line camelcase
        const baidu_layer = this.createBaiDuLayer(data)
        resolve(baidu_layer)
      })
    } else if (data.type === 'gaode') {
      return new Promise(resolve => {
        const layer = this.createGaoDeLayer(data)
        resolve(layer)
      })
    } else if (data.type === 'arcgisOffLineLayer') {
      return new Promise(resolve => {
        const layer = this.createArcGISOffLineTileLayer(data)
        resolve(layer)
      })
    }
  }

  /**
   * 创建ArcGIS的REST服务的切片服务图层
   * @param {*} num
   * @param {*} len
   * @param {*} radix
   */
  // 给8位字符串文件名补0
  zeroPad(num, len, radix) {
    var str = num.toString(radix || 10)
    while (str.length < len) {
      str = '0' + str
    }
    return str
  }
  /**
   * 创建ArcGIS的离线切片服务
   * @param {*} data
   */
  createArcGISOffLineTileLayer(data) {
    var that = this
    const layer = new TileLayerA({
      id: data.id,
      layerTag: data.layerTag,
      // opacity: data.opacity,
      zIndex: data.mapIndex,
      source: new XYZ({
        // minZoom:12,
        // maxZoom: 16,
        // projection: 'EPSG:4490',
        // tileSize: 512,
        tileUrlFunction(tileCoord) {
          var x = 'C' + that.zeroPad(tileCoord[1], 8, 16)
          var y = 'R' + that.zeroPad(-tileCoord[2] - 1, 8, 16)
          var z = 'L' + that.zeroPad(tileCoord[0], 2, 10)
          return data.url + z + '/' + y + '/' + x + '.png'
        }
        // ,
        // projection: 'EPSG:3857'
      })
    })
    return layer
  }
  /**
   * 创建ArcGIS的REST服务的切片服务图层
   * @param {*} data
   * @param {*} options
   */
  createArcGISTileLayer(data, options) {
    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution ? data.maxResolution : options.resolutions[0] * 2,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new XYZSource({
        projection: options.projCode,
        crossOrigin: 'anonymous',
        declutter: true,
        tileGrid: new TileGrid({
          extent: options.extent,
          origin: options.origin,
          resolutions: options.resolutions,
          tileSize: options.tileSize
        }),
        url: data.url + options.extUrl
      })
    })
    return layer
  }

  /**
   * 创建GeoServer的TMS服务图层
   * @param {*} data
   * @param {*} options
   */
  createGeoServerTMSLayer(data, options) {
    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution ? data.maxResolution : options.resolutions[0] * 2,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new XYZSource({
        projection: options.projCode,
        crossOrigin: 'anonymous',
        declutter: true,
        tileGrid: new TileGrid({
          extent: options.extent,
          resolutions: options.resolutions,
          tileSize: options.tileSize
        }),
        url: data.url + options.extUrl
      })
    })
    return layer
  }

  /**
   * 创建GeoServer矢量切片图层
   * @param {*} data
   * @param {*} options
   */
  createGeoServerVectorTileLayer(data, options) {
    this.idProp = data.idProp
    const layer = new VectorTileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      option: data,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution ? data.maxResolution : options.resolutions[0] * 2,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      declutter: true,
      source: new VectorTileSource({
        projection: options.projCode,
        crossOrigin: 'anonymous',
        format: new MVT(),
        tileGrid: new TileGrid({
          extent: options.extent,
          // ！！！openlayers默认为左上角原点，geoserver提供的为左下角原点
          // origin: options.origin,
          resolutions: options.resolutions,
          tileSize: options.tileSize
        }),
        url: data.url + options.extUrl
      })
    })
    return layer
  }

  /**
   * 创建ArcGIS和GeoServer的WMS服务图层
   * @param {*} data
   * @param {*} options
   */
  createImageWMSLayer(data, options) {
    const layer = new ImageLayer({
      id: data.id,
      type: data.type,
      layerTag: data.layerTag,
      option: data,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new ImageWMSSouece({
        crossOrigin: 'anonymous',
        url: data.url + '/wms',
        params: {
          LAYERS: data.visibleLayers,
          VERSION: '1.1.0'
        }
      })
    })
    return layer
  }

  /**
   * 创建天地图图层
   * @param {*} data
   * @param {*} options
   */
  createTDTLayer(data, options) {
    let extent = []
    const parser = new WMTSCapabilities()
    const result = parser.read(options.CapabilitiesXml)
    const layers = result['Contents']['Layer']
    // const targetLayer = find(layers, function(elt) {
    //   return elt['Identifier'] === data.visibleLayers[0]
    // })
    const targetLayer = layers.find((elt) => {
      return elt['Identifier'] === data.visibleLayers[0]
    })
    extent = targetLayer['WGS84BoundingBox']
    const WMTSSourceOptions = optionsFromCapabilities(result, {
      layer: data.visibleLayers
    })

    // 天地图Capabilities.xml中TopLeftCorner坐标规范为[y,x],在这里需转换为[x,y]
    for (let i = 0; i < WMTSSourceOptions.tileGrid.origins_.length; i++) {
      WMTSSourceOptions.tileGrid.origins_[i].reverse()
    }
    WMTSSourceOptions.crossOrigin = 'anonymous'
    WMTSSourceOptions.urls[0] = data.url

    // 全国天地图处理
    if (data.url.indexOf('?tk=') > -1) {
      const resolutions = []
      const matrixIds = []
      for (let z = 1; z < 19; ++z) {
        resolutions[z] = getWidth(extent) / WMTSSourceOptions.tileGrid.tileSizes_[z - 1] / Math.pow(2, z)
        matrixIds[z] = z
      }

      WMTSSourceOptions.tileGrid.extent_ = extent
      WMTSSourceOptions.tileGrid.resolutions_ = resolutions
      WMTSSourceOptions.tileGrid.matrixIds_ = matrixIds
      WMTSSourceOptions.urls[0] = data.url + '&' + newGuid()
    }

    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: 1,
      initExtent: extent,
      zIndex: data.mapIndex,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new WMTSSource(WMTSSourceOptions)
    })
    return layer
  }

  /**
   * 创建浙江天地图图层
   * @param {*} data
   * @param {*} options
   */
  createTDTZJLayer(data, options) {
    let extent = []
    const parser = new WMTSCapabilities()
    const result = parser.read(options.CapabilitiesXml)
    const layers = result['Contents']['Layer']
    // eslint-disable-next-line
    // const targetLayer = find(layers, function(elt, index, array) {
    //   return elt['Identifier'] === data.visibleLayers[0]
    // })
    const targetLayer = layers.find((elt) => {
      return elt['Identifier'] === data.visibleLayers[0]
    })
    // extent = targetLayer["WGS84BoundingBox"];
    extent = [-180, -90, 180, 90]
    const WMTSSourceOptions = optionsFromCapabilities(result, {
      layer: data.visibleLayers[0]
    })

    // 天地图Capabilities.xml中TopLeftCorner坐标规范为[y,x],在这里需转换为[x,y]
    // for (let i = 0; i < WMTSSourceOptions.tileGrid.origins_.length; i++) {
    //   WMTSSourceOptions.tileGrid.origins_[i].reverse();
    // }
    // WMTSSourceOptions.crossOrigin = "anonymous";
    WMTSSourceOptions.urls[0] = data.url
    // 全国天地图处理
    if (data.url.indexOf('?token=') > -1) {
      const resolutions = []
      const matrixIds = []
      for (let z = 7; z < 21; ++z) {
        resolutions[z] = getWidth(extent) / WMTSSourceOptions.tileGrid.tileSizes_[z - 1] / Math.pow(2, z)
        matrixIds[z] = z
      }

      WMTSSourceOptions.format = 'image/jpgpng'
      WMTSSourceOptions.tileGrid.tileSize_ = 256
      WMTSSourceOptions.tileGrid.origin_ = getTopLeft(WMTSSourceOptions.projection.getExtent())
      WMTSSourceOptions.tileGrid.projection_ = WMTSSourceOptions.projection
      WMTSSourceOptions.tileGrid.extent_ = extent
      WMTSSourceOptions.tileGrid.resolutions_ = resolutions
      WMTSSourceOptions.tileGrid.matrixIds_ = matrixIds
      WMTSSourceOptions.url = data.url
    }
    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: 1,
      initExtent: extent,
      zIndex: data.mapIndex,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      // minResolution: 0.000001341104507446289,
      // maxResolution: 0.02197265625,
      // source: new WMTSSource(WMTSSourceOptions)
      source: new WMTSSource({
        name: '浙江矢量7-20级',
        projection: WMTSSourceOptions.projection,
        url: data.url,
        // "https://ditu.zjzwfw.gov.cn:443/mapserver/vmap/WMTS/1.0/zjvmap/tdt_qingxinyangshi_2017?token=73858d998645bac1848d7d94ceb1e87c",
        layer: 'zjvmap',
        style: 'default',
        matrixSet: 'default028mm',
        format: 'image/jpgpng',
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: WMTSSourceOptions.tileGrid.origin_,
          resolutions: WMTSSourceOptions.tileGrid.resolutions_.slice(7, 21),
          matrixIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        })
      })
    })
    return layer
  }

  /**
   * 创建天地图图层  离线
   * @param {*} data
   * @param {*} options
   */
  createTDTLayer_offLine(data) {
    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: 1,
      zIndex: data.mapIndex,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new XYZ({
        url: data.url
      })
    })
    return layer
  }

  /**
   * 创建ArcGIS动态服务图层
   * @param {*} data
   * @param {*} options
   */
  createArcGISDynamicLayer(data, options) {
    const layer = new ImageLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new ImageArcGISRest({
        crossOrigin: 'anonymous',
        // imageLoadFunction: function(image, src) {
        //   image.getImage().src = src.replace('&', '?') + '&' + newGuid()
        // },
        url: data.url,
        params: {
          LAYERS: 'show:' + data.visibleLayers.join(',')
        }
      })
    })
    return layer
  }

  /**
   * 创建ArcGIS的featureServer服务图层
   * @param {*} data
   * @param {*} options
   */
  createArcGISFeatureLayer(data, options) {
    var esrijsonFormat = new EsriJSON()
    const vectorSource = new VectorSource({
      loader: function(extent, resolution, projection) {
        var url =
          data.url +
          '/' +
          data.visibleLayers +
          '/query/?f=json&' +
          'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
          encodeURIComponent(
            '{"xmin":' +
            extent[0] +
            ',"ymin":' +
            extent[1] +
            ',"xmax":' +
            extent[2] +
            ',"ymax":' +
            extent[3] +
            ',"spatialReference":{"wkid":102100}}'
          ) +
          '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' +
          '&outSR=102100'
        $.ajax({
          url: url,
          dataType: 'jsonp',
          success: function(response) {
            if (response.error) {
              console.log(url)
              console.log(response.error.message + '\n' + response.error.details.join('\n'))
            } else {
              // dataProjection will be read from document
              var features = esrijsonFormat.readFeatures(response, {
                featureProjection: projection
              })
              if (features.length > 0) {
                vectorSource.addFeatures(features)
              }
            }
          }
        })
      },
      strategy: tileStrategy(
        createXYZ({
          tileSize: 512
        })
      )
    })
    const layer = new VectorLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: vectorSource
    })
    return layer
  }

  /**
   * 创建GeoServer的WFS图层
   * @param {*} data
   * @param {*} options
   */
  createGeoServerWFSLayer(data, options) {
    let propertyName
    let propertyValue
    let propertyValue2
    let propertyValue3
    let vectorSource
    if (data.filter) {
      // 查询条件
      // let bboxFilters=new bboxFilter('geom',extent,projection);
      let equalToFilters = null
      let filters = null
      const orFiltersArray = []
      let orFilters = null

      if (data.filter.split('and')[1]) {
        // 年份和信用代码
        propertyName = data.filter
          .split('and')[0]
          .split('in')[0]
          .trim()
        propertyValue = data.filter
          .split('and')[0]
          .split('in')[1]
          .replace('(', '')
          .replace(')', '')
          .trim()
          .split(',')

        // eslint-disable-next-line no-undef
        propertyName2 = data.filter
          .split('and')[1]
          .split('in')[0]
          .trim()
        propertyValue2 = data.filter
          .split('and')[1]
          .split('in')[1]
          .replace('(', '')
          .replace(')', '')
          .trim()
          .split(',')

        equalToFilters = new EqualToFilter('NF', propertyValue2)
        for (let i = 0; i < propertyValue.length; i++) {
          const equalFiters = new EqualToFilter(
            'XYDM',
            propertyValue[i]
              .replace(new RegExp("'", 'g'), '')
              .replace(new RegExp('"', 'g'), '')
              .trim()
          )
          orFiltersArray.push(equalFiters)
        }

        orFilters = new OrFilter(orFiltersArray[1], orFiltersArray[2])
        orFilters.conditions = orFiltersArray
        filters = new AndFilter(equalToFilters, orFilters)
      } else if (data.filter.split('=')[1]) {
        // 年份查
        // eslint-disable-next-line no-undef
        propertyName3 = data.filter.split('=')[0].trim()
        propertyValue3 = data.filter.split('=')[1].trim()
        equalToFilters = new EqualToFilter('NF', propertyValue3)
        filters = equalToFilters
      } else {
        // 信用代码查
        propertyName = data.filter.split('in')[0].trim()
        propertyValue = data.filter
          .split('in')[1]
          .replace('(', '')
          .replace(')', '')
          .trim()
          .split(',')

        for (let i = 0; i < propertyValue.length; i++) {
          const equalFiters = new EqualToFilter(propertyName, propertyValue[i])
          orFiltersArray.push(equalFiters)
        }
        orFilters = new OrFilter(orFiltersArray[1], orFiltersArray[2])
        orFilters.conditions = orFiltersArray

        filters = orFilters
      }

      // generate a GetFeature request
      const featureRequest = new WFS().writeGetFeature({
        srsName: 'EPSG:4490',
        featureNS: 'http://www.opengeospatial.net/cite',
        featurePrefix: 'cite',
        // featureTypes: ['ouhaienterprise'],
        featureTypes: [data.layerTag],
        outputFormat: 'application/json',
        // filter: AndFilter(
        //             bboxFilter('geom',extent,projection),
        //             EqualToFilter('nf', '2018'),
        //             OrFilter(
        //                 EqualToFilter('xydm', '123123123')
        //             )
        // )
        filter: filters
      })

      vectorSource = new VectorSource()
      // then post the request and add the received features to a layer
      fetch(data.url, {
        method: 'POST',
        body: new XMLSerializer().serializeToString(featureRequest)
      })
        .then(function(response) {
          return response.json()
        })
        .then(function(json) {
          var features = new GeoJSON().readFeatures(json)
          vectorSource.addFeatures(features)
        })
    } else {
      vectorSource = new VectorSource({
        format: new GeoJSON(),
        url: extent => {
          return (
            data.url +
            '?services=WFS&' +
            'version=1.1.0&request=GetFeature&typename=' +
            data.visibleLayers +
            '&' +
            'outputFormat=application/json&srsname=' +
            this.map
              .getView()
              .getProjection()
              .getCode() +
            '&' +
            'bbox=' +
            extent.join(',') +
            ',' +
            this.map
              .getView()
              .getProjection()
              .getCode()
          )
        },
        strategy: bboxStrategy
      })
    }
    // let url = data.url + '/wfs?services=WFS&' +
    //   'version=1.1.0&request=GetFeature&typename=' + data.visibleLayers + '&' +
    //   'outputFormat=application/json&srsname=' + this.map.getView().getProjection().getCode()
    // // filter:过滤条件字段
    // if (data.filter) {
    //   url += '&cql_filter=' + data.filter
    // }
    // let source = new VectorSource({
    //   format: new GeoJSON(),
    //   url: url,
    //   strategy: bboxStrategy
    // })
    // cluster：聚合字段
    if (data.cluster) {
      const clusterSource = new VectorSource({
        format: new GeoJSON()
      })
      vectorSource = new Cluster({
        distance: data.clusterDistance || 40,
        source: clusterSource
      })

      $.ajax({
        // eslint-disable-next-line no-undef
        url: url,
        type: 'GET',
        success: response => {
          const format = new GeoJSON()
          const features = format.readFeatures(response)
          clusterSource.addFeatures(features)
        },
        error: error => {
          console.error(error)
        }
      })
    }

    const layer = new VectorLayer({
      id: data.id,
      type: data.type,
      layerTag: data.layerTag,
      option: data,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: vectorSource
    })
    if (this.layerStyles.length > 0) {
      for (let i = 0; i < this.layerStyles.length; i++) {
        if (layer.get('layerTag') === this.layerStyles[i].layerTag) {
          layer.setStyle(this.layerStyles[i].style)
          break
        }
      }
    }
    return layer
  }

  /**
   * 创建WMTS服务图层
   * @param {*} data
   * @param {*} options
   */
  createWMTSLayer(data, options) {
    let extent = []
    var parser = new WMTSCapabilities()
    var result = parser.read(options.CapabilitiesXml)
    var WMTSSourceOptions = optionsFromCapabilities(result, {
      layer: data.visibleLayers
    })
    var layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      // maxResolution: WMTSSourceOptions.tileGrid.resolutions_ [0] * 2,
      source: new WMTSSource(/** @type {!module:ol/source/WMTS~Options} */(WMTSSourceOptions))
    })
    // 初始范围
    if (layer.getSource().getTileGrid().extent_) {
      extent = layer.getSource().getTileGrid().extent_
    } else {
      const xmlObj = new DOMParser().parseFromString(options.CapabilitiesXml, 'text/xml')
      const layerObj = $(xmlObj).find('Layer')
      let targetTileMatrixName
      for (let i = 0; i < layerObj.length; i++) {
        if ($(layerObj[i]).children('ows\\:Identifier')[0].innerHTML === data.visibleLayers[0]) {
          targetTileMatrixName = $(layerObj[i])
            .children('TileMatrixSetLink')
            .children('TileMatrixSet')[0].innerHTML
        }
        if (targetTileMatrixName) {
          break
        }
      }
      const topLeftPoint = layer.getSource().getTileGrid().origins_[0]
      const resolution = layer.getSource().getTileGrid().resolutions_[0]
      const tileMatrixSets = result['Contents']['TileMatrixSet']
      // const tileMatrixSet = find(tileMatrixSets, function(elt) {
      //   return elt['Identifier'] === targetTileMatrixName
      // })
      const tileMatrixSet = tileMatrixSets.find((elt) => {
        return elt['Identifier'] === targetTileMatrixName
      })
      const MatrixHeight = tileMatrixSet['TileMatrix'][0]['MatrixHeight']
      const MatrixWidth = tileMatrixSet['TileMatrix'][0]['MatrixWidth']
      const TileWidth = tileMatrixSet['TileMatrix'][0]['TileWidth']
      const TileHeight = tileMatrixSet['TileMatrix'][0]['TileHeight']
      extent = [
        topLeftPoint[0],
        topLeftPoint[1] - resolution * MatrixHeight * TileHeight,
        topLeftPoint[0] + resolution * MatrixWidth * TileWidth,
        topLeftPoint[1]
      ]
    }
    layer.set('initExtent', extent)
    return layer
  }

  /**
   * 创建ArcGIS服务的WFS图层
   * @param {*} data
   * @param {*} options
   */
  createArcGISWFSLayer(data, options) {
    var layer = new VectorLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: data.opacity,
      zIndex: data.mapIndex,
      initExtent: options.initExtent,
      minResolution: data.minResolution,
      maxResolution: data.maxResolution,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new VectorSource({
        format: new GML3(),
        url: extent => {
          return (
            data.url +
            '?services=WFS&' +
            'version=1.1.0&request=GetFeature&typename=' +
            data.visibleLayers +
            '&' +
            'outputFormat=gml3&srsname=' +
            this.map
              .getView()
              .getProjection()
              .getCode() +
            '&' +
            'bbox=' +
            extent.join(',') +
            ',' +
            this.map
              .getView()
              .getProjection()
              .getCode()
          )
        },
        strategy: bboxStrategy
      })
    })
    return layer
  }

  /**
   * 创建高德地图服务图层
   * @param {*} data
   */
  createBaiDuLayer(data) {
    const extent = [-20037726.37, -12474104.17, 20037726.37, 12474104.17]
    // var extent = [72.004, 0.8293, 137.8347, 55.8271];
    const baiduMercator = new Projection({
      code: 'baidu',
      extent: extent,
      units: 'm'
    })
    addProjection(baiduMercator)
    addCoordinateTransforms(
      'EPSG:4326',
      baiduMercator,
      projzh.ll2bmerc,
      projzh.bmerc2ll
    )
    addCoordinateTransforms(
      'EPSG:3857',
      baiduMercator,
      projzh.smerc2bmerc,
      projzh.bmerc2smerc
    )

    const bmercResolutions = new Array(19)
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 19; ++i) {
      // eslint-disable-next-line no-restricted-properties
      bmercResolutions[i] = Math.pow(2, 18 - i)
    }

    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      opacity: 1,
      // initExtent: extent,
      zIndex: data.mapIndex,
      source: new XYZSource({
        projection: 'baidu',
        maxZoom: 18,
        // eslint-disable-next-line func-names
        tileUrlFunction: function(tileCoord) {
          let x = tileCoord[1]
          let y = tileCoord[2] + 1
          const z = tileCoord[0]
          if (x < 0) {
            x = -x
          }
          if (y < 0) {
            y = -y
          }
          // if (x < 0) {
          //   x = 'M' + -x;
          // }
          // if (y < 0) {
          //   y = 'M' + -y;
          // }
          /**
           * 默认地图样式(normal)
           * 清新蓝风格(light)
           * 黑夜风格(dark)
           * 红色警惕风格(redalert)
           * 精简风格(googlelite)
           * 天然绿风格(grassgreen)
           * 午夜蓝风格(midnight)
           * 浪漫粉风格(pink)
           * 青春绿风格(darkgreen)
           * 清新蓝绿风格(bluish)
           * 高端灰风格(grayscale)
           * 强边界风格(hardedge)
           */
          //  return "http://online3.map.bdimg.com/onlinelabel/?qt=tile&x=" + x + "&y=" + y + "&z=" + z + "&styles=pl&udt=20151021&scaler=1&p=1";
          // return 'http://api0.map.bdimg.com/customimage/tile?customid=midnight&x=' + x
          // + '&y=' + y + '&z=' + z;
          return (
            'https://api.map.baidu.com/customimage/tile?x=' +
            x +
            '&y=' +
            y +
            '&z=' +
            z +
            '&udt=20170908&scale=2&ak=ZUONbpqGBsYGXNIYHicvbAbM' +
            '&styles=t%3Aland%7Ce%3Ag.f%7Cc%3A%23122231ff%2Ct%3Awater%7Ce%3Aall%7Cc%3A%230f3260ff%2Ct%3Agreen%7Ce%3Ag.f%7Cc%3A%232d5470ff%2Ct%3Ahighway%7Ce%3Aall%7Cv%3Aoff%7Cc%3A%232d5470ff%2Ct%3Aarterial%7Ce%3Aall%7Cc%3A%232d5470ff%2Ct%3Alocal%7Ce%3Aall%7Cc%3A%2320325cff%2Ct%3Amanmade%7Ce%3Ag.f%7Cc%3A%2320325cff%2Ct%3Abuilding%7Ce%3Aall%7Cc%3A%231b3453ff%2Ct%3Asubway%7Ce%3Al.i%7Cv%3Aon%7Cc%3A%232d5470ff%2Ct%3Aroad%7Ce%3Al.t.f%7Cc%3A%232fe4d6ff%2Ct%3Aadministrative%7Ce%3Al.t.f%7Cc%3A%232fe4d6ff%2Ct%3Apoi%7Ce%3Al%7Cv%3Aoff%2Ct%3Aadministrative%7Ce%3Al.t.s%7Cc%3A%232d5470ff%2Ct%3Asubway%7Ce%3Ag.s%7Cc%3A%232d5470ff%2Ct%3Atown%7Ce%3Al%7Cv%3Aoff%2Ct%3Asubway%7Ce%3Al.t.s%7Cc%3A%2320325cff%2Ct%3Amanmade%7Ce%3Al.i%7Cv%3Aoff%2Ct%3Amanmade%7Ce%3Al.t.s%7Cv%3Aoff'
          )
        },
        tileGrid: new TileGrid({
          resolutions: bmercResolutions,
          origin: [0, 0],
          extent: applyTransform(extent, projzh.ll2bmerc),
          tileSize: [256, 256]
        })
      })
    })
    return layer
  }

  /**
   * 创建高德地图服务图层
   * @param {*} data
   */
  createGaoDeLayer(data) {
    const layer = new TileLayer({
      id: data.id,
      layerTag: data.layerTag,
      initExtent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
      opacity: data.opacity,
      zIndex: data.mapIndex,
      isFit: typeof data.isFit === 'boolean' ? data.isFit : true,
      source: new XYZSource({
        crossOrigin: 'anonymous',
        projection: gcjMecator,
        url: data.url
      })
    })
    const extent = layer
      .getSource()
      .getTileGrid()
      .getExtent()
    layer.set('initExtent', extent)
    return layer
  }
}

export default LayerGenerater
