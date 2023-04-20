import { Message } from 'element-ui'
import View from 'ol/View.js'
import { Tile as TileLayer } from 'ol/layer.js'
import VectorTileLayer from 'ol/layer/VectorTile.js'
import { transformExtent } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style, Text, Icon } from 'ol/style.js'
import { find } from 'ol/array.js'
import locationIcon from '../../assets/img/location.png'
// import centerIcon from '@/assets/iview/img/rf_blue.png'
import { Projection, addProjection, addCoordinateTransforms } from 'ol/proj'
import TileWMS from 'ol/source/TileWMS'
import XYZ from 'ol/source/XYZ'
import ImageWMS from 'ol/source/ImageWMS'
import { Image as ImageLayer } from 'ol/layer'
/**
 * 图层控制类
 *   a)WFS、WMS和feature服务的这类矢量图层(VectorLayer)，目前可以在任何坐标系下展示；
 *   b)切片类图层（包含包括ArcGIS REST Tiled/WMTS/矢量切片,以及GeoServer的WMTS/TMS）的展示，
 *     取决于发布服务的数据源的坐标系。数据源什么坐标系，切片图层就只能在什么坐标系下展示；
 *   c)Wfs服务在发布时，避免服务名称用中文或者含有中文，会导致无法在平台注册。
 */
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
// var i = 0
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

var projzh = {}
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
addCoordinateTransforms('EPSG:4490', gcjMecator, projzh.ll2gmerc, projzh.gmerc2ll)
addCoordinateTransforms('EPSG:3857', gcjMecator, projzh.smerc2gmerc, projzh.gmerc2smerc)

class LayerManager {
  constructor(map, layerStyles) {
    this.map = map
    // WFS图层样式
    this.layerStyles = layerStyles || []
    // 切片图层(只能存在一个坐标系下的切片图层)
    this.tildLayer = []
    // 预加载图层
    this.preLayers = [
      // 绘制图层
      new VectorLayer({
        id: 'drawLayer',
        zIndex: 999999,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
              color: '#FF0000',
              width: 2
            }),
            // image: new CircleStyle({
            //   radius: 7,
            //   fill: new Fill({
            //     color: '#FF0000'
            //   })
            // })
            image: new Icon({
              src: locationIcon,
              anchor: [0.5, 0.8]
            })
            // text: new Text({
            //   // 文字内容
            //   text: feature.get('name'),
            //   // 文字样式
            //   font: 'normal 16px 微软雅黑',
            //   // 文本填充样式（即文字颜色）
            //   fill: new Fill({ color: '#000000' })
            //   // stroke: new Stroke({ color: '#ffcc33', width: 5 })
            // })
          })
        }
      }),
      // 定位图层
      new VectorLayer({
        id: 'locateLayer',
        zIndex: 1000,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
              color: '#00FFFF',
              width: 2
            }),
            image: new Icon({
              src: locationIcon,
              anchor: [0.5, 0.8]
            })
          })
        }
      }),
      // 地图下钻展示图层
      new VectorLayer({
        id: 'mapDrillDownLayer',
        zIndex: 1000,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new Stroke({
              color: '#04387b',
              width: 2
            }),
            text: new Text({
              text: feature.get('regionName')
            })
          })
        }
      }),
      // 行政区划渐变色专题展示图层
      new VectorLayer({
        id: 'colorRegionLayer',
        zIndex: 1000,
        source: new VectorSource()
      }),
      // 行政区划定位图层
      new VectorLayer({
        id: 'regionNavigation',
        zIndex: 1000,
        source: new VectorSource(),
        style: feature =>
          new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new Stroke({
              color: '#0000FF',
              width: 4
            }),
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({
                color: '#FF0000'
              })
            }),
            text: new Text({
              // 文字内容
              text: feature.get('XZQMC'),
              // 文字样式
              font: 'normal 16px 微软雅黑',
              // 文本填充样式（即文字颜色）
              fill: new Fill({ color: '#000000' })
              // stroke: new Stroke({ color: '#ffcc33', width: 5 })
            })
          })
      }),
      // 地名地址搜索结果图层
      new VectorLayer({
        id: 'searchResultLayer',
        zIndex: 999999,
        source: new VectorSource()
      }),
      // 轨迹展示图层
      new VectorLayer({
        id: 'trackLayer',
        zIndex: 1000,
        source: new VectorSource(),
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0)'
          }),
          stroke: new Stroke({
            color: '#0000CD',
            width: 2
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: '#FF0000'
            })
          })
        })
      }),
      // 乡镇界
      new VectorLayer({
        id: 'townLayer',
        zIndex: 1000,
        minZoom: 11,
        source: new VectorSource(),
        style: feature => {
          const text = feature.get('NAME')
          return new Style({
            fill: new Fill({
              color: 'rgba(0, 255, 255, 0.001)'
            }),
            stroke: new Stroke({
              color: 'rgba(0, 255, 255, 1)'
            }),
            text: new Text({
              // 文字内容
              text: text,
              // 文字样式
              font: 'normal 14px 微软雅黑',
              // 文本填充样式（即文字颜色）
              fill: new Fill({ color: '#000000' }),
              stroke: new Stroke({ color: '#ffcc33', width: 5 })
            })
          })
        }
      }),
      // 市县界
      new VectorLayer({
        id: 'cityLayer',
        zIndex: 10000,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
              color: '#00FFFF',
              width: 2
            }),
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({
                color: '#FF0000'
              })
            }),
            text: new Text({
              // 文字内容
              text: feature.get('name'),
              // 文字样式
              font: 'normal 16px 微软雅黑',
              // 文本填充样式（即文字颜色）
              fill: new Fill({ color: '#000000' })
              // stroke: new Stroke({ color: '#ffcc33', width: 5 })
            })
          })
        }
      }),
      // 行政区中心点1  数字
      new VectorLayer({
        id: 'centerLayer1',
        zIndex: 1001,
        visible: true,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new Stroke({
              color: '#04387b',
              width: 2
            }),
            // image: new Icon({
            //   src: centerIcon,
            //   scale: 0.6
            // }),
            text: new Text({
              text: feature.get('projectnum').toString(),
              // 文字样式
              font: 'normal 20px 微软雅黑',
              // 文本填充样式（即文字颜色）
              fill: new Fill({ color: '#fff' }),
              backgroundFill: new Fill({ color: 'rgba(77, 124, 254, 0.44)' }),
              backgroundStroke: new Stroke({
                color: 'rgb(81, 127, 254)',
                width: 1
              }),
              padding: [0, 7, -3, 7],
              offsetY: -22
            })
          })
        }
      }),
      // 行政区中心点2 名称
      new VectorLayer({
        id: 'centerLayer2',
        zIndex: 1002,
        visible: true,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new Stroke({
              color: '#04387b',
              width: 2
            }),
            text: new Text({
              text: feature.get('name').toString(),
              // 文字样式
              font: 'normal 15px 微软雅黑',
              // 文本填充样式（即文字颜色）
              fill: new Fill({ color: '#000000' }),
              backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
              backgroundStroke: new Stroke({
                color: 'rgba(195, 195, 195, 1)',
                width: 2
              }),
              padding: [2, 4, 0, 4],
              offsetY: 22
            })
          })
        }
      }),
      // 遮罩图层
      new VectorLayer({
        id: 'maskLayer',
        zIndex: 11000,
        source: new VectorSource(),
        visible: false,
        style: () => {
          return new Style({
            fill: new Fill({
              color: 'rgba(11,31,75, 1)'
            }),
            stroke: new Stroke({
              color: 'rgba(0,197,157, 1)',
              width: 2
            })
          })
        }
      }),
      // 人防工程图层
      new VectorLayer({
        id: 'projectsLayer',
        zIndex: 1000,
        source: new VectorSource(),
        style: feature => {
          return new Style({
            image: new Icon({
              src: locationIcon,
              scale: 0.5,
              anchor: [0.5, 0.8]
            })
            // text: new Text({
            //   //文字内容
            //   text: this.map.getView().getZoom() > 15 ? feature.get('gcmc') : '',
            //   //文字样式
            //   font: 'normal 12px 微软雅黑',
            //   //文本填充样式（即文字颜色）
            //   fill: new Fill({ color: '#ffcc33' }),
            //   stroke: new Stroke({ color: '#000000', width: 5 }),
            //   offsetY: -25
            // })
          })
        }
      }),
      // 人口热力图层
      new TileLayer({
        id: 'population_heatLayer',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          projection: gcjMecator,
          // projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/1157D68606985D591A0BF63BDECFDE01/wms',
          params: { LAYERS: '164930320262145' },

          // url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/D45E2C79A740993D5C6EA38895D4FC4F/wms',
          // params: { LAYERS: '165787312862757' },

          // url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/4FBF0362BEAABC9980873C540126E705/wms',
          // params: { 'LAYERS': '165787806275388', 'TILED': true },

          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 交通路况
      new TileLayer({
        id: 'road_state',
        zIndex: 11111,
        visible: false,
        source: new XYZ({
          projection: gcjMecator,
          url: 'https://tm.amap.com/trafficengine/mapabc/traffictile?v=2.0&;t=1&x={x}&y={y}&z={z}&&t=' + this.getLongTime()

          // url: 'http://tm.amap.com/trafficengine/mapabc/traffictile?v=2.0&;t=1&x={x}&y={y}&z={z}&&t=1649841426728' //7,8
        }),
        projection: 'EPSG:4490'
      }),

      new ImageLayer({
        id: 'china_city',
        zIndex: 1,
        visible: false,
        // source: new XYZ({
        //   projection: 'EPSG:4326',
        //   url: 'https://szh.rfb.zj.gov.cn/geoserver/gwc/service/tms/1.0.0/cite:全国省级行政区@EPSG%3A4326@png/{z}/{x}/{-y}.png'
        // })
        source: new ImageWMS({
          projection: 'EPSG:4326',
          url: 'https://szh.rfb.zj.gov.cn:8180/geoserver/wms?request=getCapabilities', // wms 请求地址
          params: { 'LAYERS': 'xzq_data:china_xzq' },
          serverType: 'geoserver',
          crossOrigin: 'anonymous' // 跨域设置
        })
      }),

      // 浙江省热力图
      new TileLayer({
        id: 'zj_heatLayer',
        layerTag: '浙江省',
        zIndex: 1000,
        visible: false,
        source: new TileWMS({
          projection: 'EPSG:3857',
          hidpi: false,
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/DF63F6EDF82D0E71B2B86F51E37A59BA/wms',
          params: { 'LAYERS': '165813420183324', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 杭州市
      new TileLayer({
        id: 'hz_heatLayer',
        layerTag: '杭州市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          // interpolate: true,
          // ratio: 2,
          hidpi: false,
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/DF63F6EDF82D0E71B2B86F51E37A59BA/wms',
          params: { 'LAYERS': '165813420183324', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 宁波市
      new TileLayer({
        id: 'nb_heatLayer',
        layerTag: '宁波市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/FEAF6E7D3A8ECC11AE55CA9AD452EEB5/wms',
          params: {
            'FORMAT': 'image/jpeg',
            'LAYERS': '165813588780320',
            'TILED': true
          },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 温州市
      new TileLayer({
        id: 'wz_heatLayer',
        layerTag: '温州市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/4D284D30AAA2B29A4293AA5C27898F0F/wms',
          params: { 'LAYERS': '165813603352896', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 湖州市
      new TileLayer({
        id: 'hz_heatLayer',
        layerTag: '湖州市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/79C3533669D0629A4841AF2199048121/wms',
          params: { 'LAYERS': '165813654141711', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 嘉兴市
      new TileLayer({
        id: 'jx_heatLayer',
        layerTag: '嘉兴市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/F116D7E29DD35EF08BC8298060B53345/wms',
          params: { 'LAYERS': '165813626668172', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 绍兴市
      new TileLayer({
        id: 'sx_heatLayer',
        layerTag: '绍兴市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/68FF8F1B19354A6449B72DD62515153A/wms',
          params: { 'LAYERS': '165813801127067', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 金华市
      new TileLayer({
        id: 'jh_heatLayer',
        layerTag: '金华市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/E12EB1F9E163DC4AD8A3FDA809D86772/wms',
          params: { 'LAYERS': '165813821599895', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 衢州市
      new TileLayer({
        id: 'qz_heatLayer',
        layerTag: '衢州市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/CA31235A5A97E615F3B725D890CAAA3A/wms',
          params: { 'LAYERS': '165813843117772', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 舟山市
      new TileLayer({
        id: 'zs_heatLayer',
        layerTag: '舟山市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/2CB876A18DB9512CD440F9C9EC95FA3D/wms',
          params: { 'LAYERS': '165813855269345', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 台州市
      new TileLayer({
        id: 'tz_heatLayer',
        layerTag: '台州市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/95309EF0DD0C503776393B3483021E14/wms',
          params: { 'LAYERS': '165813871053248', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      }),
      // 丽水市
      new TileLayer({
        id: 'ls_heatLayer',
        layerTag: '丽水市',
        zIndex: 22222,
        visible: false,
        source: new TileWMS({
          // projection: gcjMecator,
          projection: 'EPSG:3857',
          url: 'https://szh.rfb.zj.gov.cn/ituc/zChart/gis/82FEBBD1356BC1512D5E44EE8D06789C/wms',
          params: { 'LAYERS': '165813884582189', 'TILED': true },
          serverType: 'geoserver'
        }),
        projection: 'EPSG:4490'
      })
    ]
    this.addPreLayers()
  }
  /**
     * 获取时间戳
     * @return {number}
     */
  getLongTime() {
    const nowDate = new Date()
    const year = nowDate.getFullYear()
    let month = nowDate.getMonth() + 1
    let today = nowDate.getDate()
    const hours = nowDate.getHours()
    const minutes = nowDate.getMinutes()
    const seconds = nowDate.getSeconds()

    if (month >= 1 && month <= 9) {
      month = '0' + month
    }
    if (today >= 1 && today <= 9) {
      today = '0' + today
    }
    const currentdate = year + '-' + month + '-' + today + ' ' + hours + ':' + minutes + ':' + seconds
    const longTime = new Date(currentdate.replace(new RegExp('-', 'gm'), '/')).getTime()
    return longTime
  }
  getColor(num) {
    var tempColor
    var colors = ['', '#7FD1FF', '#4FA3FF', '#2C84FF', '#005BE0', '#00228D']
    if (num < 20) {
      tempColor = colors[1]
    } else if (num >= 20 && num < 40) {
      tempColor = colors[2]
    } else if (num >= 40 && num < 60) {
      tempColor = colors[3]
    } else if (num >= 60 && num < 80) {
      tempColor = colors[4]
    } else if (num >= 80) {
      tempColor = colors[5]
    }
    return tempColor
  }
  /**
   * 加载预加载图层
   */
  addPreLayers() {
    this.preLayers.forEach(layer => {
      this.map.addLayer(layer)
    })
  }

  /**
   * 添加图层的入口，供外部调用
   * @param {*} data
   */
  addLayer(data) {
    import('./LayerGenerater.js')
      .then(({ default: LayerGenerater }) => {
        const layerGenerater = new LayerGenerater(this.map, this.layerStyles)
        return layerGenerater.generate(data)
      })
      .then(layer => {
        this.addLayerToMap(layer)
      })
      .catch(error => {
        Message({
          message: error,
          type: 'error'
        })
      })
  }

  /**
   * 删除图层，对外提供调用
   * @param {*} data
   */
  removeLayer(data) {
    const layer = this.map.getLayerById(data.id)
    if (layer instanceof TileLayer) {
      for (let i = 0, l = this.tildLayer.length; i < l; i++) {
        if (layer === this.tildLayer[i]) {
          this.tildLayer.splice(i, 1)
          break
        }
      }
      // 重新设置地图minZoom maxZomm
      if (this.tildLayer.length > 0) {
        const minZooms = []
        const maxZomms = []
        this.tildLayer.forEach(element => {
          minZooms.push(element.getSource().tileGrid.minZoom)
          maxZomms.push(element.getSource().tileGrid.maxZoom)
        })
        // 取最小的minZoom和最大的MaxZoom
        minZooms.sort(function(a, b) {
          return a - b
        })
        maxZomms.sort(function(a, b) {
          return b - a
        })
        this.setMinAndMaxZoom(minZooms[0], maxZomms[0])
      } else {
        this.setMinAndMaxZoom(0, 28)
      }
    }
    this.map.removeLayer(layer)
  }

  /**
   * 将图层添加到ol的map上
   * @param {*} layer
   */
  addLayerToMap(layer) {
    if (layer instanceof TileLayer || layer instanceof VectorTileLayer) {
      const layerProjectionCode = 'EPSG:4490'
      // let layerProjectionCode = layer.getSource().getProjection().getCode() === 'EPSG:900913' || layer.getSource().getProjection().getCode() === 'EPSG:102100' ||
      //   layer.getSource().getProjection().getCode() === 'EPSG:102113' ? 'EPSG:3857' : layer.getSource().getProjection().getCode()
      // 判断当前坐标系是否与要加载的切片图层的坐标系一致，如果一致则直接叠加图层，否则先删除所有的切片图层，再加载图层
      if (
        this.map
          .getView()
          .getProjection()
          .getCode() === layerProjectionCode
      ) {
        this.map.addLayer(layer)
        if (layer.getSource().tileGrid.maxZoom === 13) {
          this.setMinAndMaxZoom(layer.getSource().tileGrid.minZoom, 20)
        } else {
          this.setMinAndMaxZoom(layer.getSource().tileGrid.minZoom, layer.getSource().tileGrid.maxZoom)
        }
        this.tildLayer.push(layer)
      } else if (this.tildLayer.length > 0) {
        for (let i = 0; i < this.tildLayer.length; i++) {
          // 通过Tee组件删除图层
          // Bus.$emit('setLayerChecked', this.tildLayer[i].get('id'), false)
        }
        // 更改坐标系
        this.changeMapProjection(layer.getSource().getProjection())
        this.map.getView().setMaxZoom(layer.getSource().tileGrid.maxZoom)
        this.map.addLayer(layer)
        this.setMinAndMaxZoom(layer.getSource().tileGrid.minZoom, layer.getSource().tileGrid.maxZoom)
        this.tildLayer.push(layer)
        // 缩放到图层
        if (layer.get('isFit')) {
          this.fitToLayer(layer)
        }
      } else {
        // 更改坐标系
        this.changeMapProjection(layer.getSource().getProjection())
        this.map.getView().setMaxZoom(layer.getSource().tileGrid.maxZoom)
        this.map.addLayer(layer)
        this.setMinAndMaxZoom(layer.getSource().tileGrid.minZoom, layer.getSource().tileGrid.maxZoom)
        this.tildLayer.push(layer)
        // 缩放到图层
        if (layer.get('isFit')) {
          this.fitToLayer(layer)
        }
      }
    } else {
      this.map.addLayer(layer)
    }
  }

  /**
   * 缩放到图层
   * @param {ol.layer.layer} layer
   */
  fitToLayer(layer) {
    if (layer instanceof TileLayer || layer instanceof VectorTileLayer) {
      this.map.getView().fit(layer.get('initExtent'), this.map.getSize())
      if (this.map.getView().getResolutionForExtent(layer.get('initExtent') > layer.getMaxResolution() / 2)) {
        this.map.getView().setResolution(layer.getMaxResolution() / 2)
      }
    } else {
      this.map.getView().fit(
        transformExtent(
          layer.get('initExtent'),
          'EPSG:4326',
          this.map
            .getView()
            .getProjection()
            .getCode()
        ),
        this.map.getSize()
      )
    }
  }

  /**
   * 设置地图最大和最小缩放等级
   * @param {*} minZoom
   * @param {*} maxZoom
   */
  setMinAndMaxZoom(minZoom, maxZoom) {
    if (this.tildLayer.length <= 0 || this.map.getView().getMinZoom() > minZoom) {
      this.map.getView().setMinZoom(minZoom)
    }
    if (this.tildLayer.length <= 0 || this.map.getView().getMaxZoom() < maxZoom) {
      this.map.getView().setMaxZoom(maxZoom)
    }
  }

  /**
   * 更改map坐标系
   * @param {ol.proj.Projection} projection
   */
  changeMapProjection(projection) {
    const minZoom = this.map.getView().getMinZoom()
    const maxZoom = this.map.getView().getMaxZoom()
    this.map.setView(
      new View({
        projection: projection,
        minZoom: minZoom,
        maxZoom: maxZoom
      })
    )
    // 发出坐标系更改的消息
    // Bus.$emit('mapProjectionChange', projection)
  }

  /**
   * 修改图层压盖顺序
   * @param {Object} item  目标图层信息
   * @param {Object} compare  对比图层
   * @param {String} type 压盖类型 before or after
   */
  changeLayerIndex(item, compare, type) {
    let mapIndex
    if (type === 'before') {
      mapIndex = this.map.getLayerById(compare.id).getZIndex() + 0.01
    } else if (type === 'after') {
      mapIndex = this.map.getLayerById(compare.id).getZIndex() - 0.01
    }
    this.map.getLayerById(item.id).setZIndex(mapIndex)
  }

  /**
   * 修改图层透明度
   * @param {Object} item
   */
  changeLayerOpacity(item) {
    if (this.map.getLayerById(item.id)) {
      this.map.getLayerById(item.id).setOpacity(item.opacity)
    }
  }
  /**
   * 设置WFS图层样式配置信息
   * @param {*} layerStyles WFS图层样式配置
   */
  setLayerStyles(layerStyles) {
    this.layerStyles = layerStyles
    const layers = this.map.getLayers().getArray()
    for (let i = 0; i < layerStyles.length; i++) {
      // const targetLayer = find(layers, function(elt) {
      //   return elt.get('layerTag') === layerStyles[i].layerTag
      // })
      const targetLayer = layers.find((elt) => {
        return elt['layerTag'] === layerStyles[i].layerTag
      })
      if (targetLayer && targetLayer instanceof VectorLayer) {
        targetLayer.setStyle(layerStyles[i].style)
        break
      }
    }
  }
}

export default LayerManager
