import $ from 'jquery'
import Select from 'ol/interaction/Select'
import ColorRegion from '../ColorRegion/ColorRegion'
import DrillEvent from './DrillEvent'
import MapEvent from 'ol/MapEvent.js'
import { extend, getCenter } from 'ol/extent'
import { pointerMove, never } from 'ol/events/condition.js'
import { Text, Fill, Stroke, Style } from 'ol/style.js'

class RegionDrillDown extends ColorRegion {
  constructor(map, config = {}) {
    super(map, config)
    this.url = 'http://api.tianditu.gov.cn/administrative'
    this.regionDrillDownData = []
    this.init()
  }

  init() {
    this.regionDrillDownData = []
    this.map.dispatchEvent(new MapEvent('regionDrillDownDataChange', this.map, this.regionDrillDownData))
    this.map.on('drillclickByPage', evt => {
      this.regionDrillDownData.splice(evt.frameState, this.regionDrillDownData.length)
    })
    // 添加选择事件
    this.addSelectInteraction()
    // 添加下钻事件
    this.addDrillDownInteraction()
    // 如果有业务数据，则要添加渐变色
    if (this.businessData.length > 0) {
      this.map.getLayerById('mapDrillDownLayer').setStyle(feature => {
        return this.getColorRegionStyle(feature.get('regionCode'), feature.get('regionName'))
      })
    }
  }

  /**
   * 入口函数，下钻方法
   * @param {*} regionCode 行政区划代码
   * @param {*} callBack 回调函数
   */
  drillToRegion(regionCode, callBack) {
    this.map.getViewport().style.cursor = 'wait'
    regionCode =
      regionCode.length === 9
        ? regionCode
        : regionCode.length >= 6
          ? '156' + regionCode
          : '156' + this.regionCodeFill(regionCode)
    const strParams = {
      searchType: 0,
      searchWord: regionCode,
      needSubInfo: true,
      needAll: false,
      needPolygon: true,
      needPre: false
    }
    const params = {
      postStr: JSON.stringify(strParams),
      tk: this.map.get('tdtKey')
    }
    $.ajax({
      url: this.url,
      type: 'GET',
      data: params,
      dataType: 'json',
      success: response => {
        if (callBack) {
          callBack()
        }
        this.map.getViewport().style.cursor = 'auto'
        if (response.returncode === '100') {
          // 判断是否有下一级数据
          if (response.data.child) {
            // 清除下钻图层数据
            this.map
              .getLayerById('mapDrillDownLayer')
              .getSource()
              .clear()
            // 记录当前行政区划数据
            this.regionDrillDownData.push({
              regionCode: this.regionCodeCut(response.data.cityCode),
              regionName: response.data.name
            })
            this.map.dispatchEvent(new MapEvent('regionDrillDownDataChange', this.map, this.regionDrillDownData))
            // 定位范围
            let extent
            response.data.child.forEach((element, i) => {
              const feature = this.getFeatureFromPoints(element.points)
              // feature属性信息
              feature.set('regionCode', this.regionCodeCut(element.cityCode))
              feature.set('regionName', element.name)
              if (i === 0) {
                extent = feature.getGeometry().getExtent()
              } else {
                extent = extend(extent, feature.getGeometry().getExtent())
              }
              this.map
                .getLayerById('mapDrillDownLayer')
                .getSource()
                .addFeature(feature)
            })
            // 定位
            this.map.getView().animate({
              center: getCenter(extent),
              resolution: this.map.getView().getResolutionForExtent(extent)
            })
          } else {
            // 当前行政区划面没有子节点数据时，则缩放到当前点击的行政区即可
            // 清除下钻图层数据
            this.map
              .getLayerById('mapDrillDownLayer')
              .getSource()
              .clear()
            // 记录当前行政区划数据
            if (
              !this.regionDrillDownData.find(item => {
                return item.regionCode === this.regionCodeCut(response.data.cityCode)
              })
            ) {
              const regionInfo = {
                regionCode: this.regionCodeCut(response.data.cityCode),
                regionName: response.data.name
              }
              this.regionDrillDownData.push(regionInfo)
              this.map.dispatchEvent(new MapEvent('regionDrillDownDataChange', this.map, this.regionDrillDownData))
            }
            const feature = this.getFeatureFromPoints(response.data.points)
            // feature属性信息
            feature.set('regionCode', this.regionCodeCut(response.data.cityCode))
            feature.set('regionName', response.data.name)
            this.map
              .getLayerById('mapDrillDownLayer')
              .getSource()
              .addFeature(feature)
            // 定位
            this.map.getView().animate({
              center: getCenter(feature.getGeometry().getExtent()),
              resolution: this.map.getView().getResolutionForExtent(feature.getGeometry().getExtent())
            })
          }
        } else {
          console.error(response.msg)
        }
      },
      error: err => {
        this.map.getViewport().style.cursor = 'auto'
        console.log(err)
      }
    })
  }

  /**
   * 添加Select事件
   */
  addSelectInteraction() {
    const select = new Select({
      condition: pointerMove,
      toggleCondition: never,
      layers: [this.map.getLayerById('mapDrillDownLayer')],
      style: feature => {
        return this.getSelectStyle(feature.get('regionCode'), feature.get('regionName'))
      }
    })
    this.map.addInteraction(select)
  }

  /**
   * 获取选择图层的样式
   * @param {*} regionCode 行政区划编码
   * @param {*} regionName 行政区划名称
   */
  getSelectStyle(regionCode, regionName) {
    regionCode =
      regionCode.length === 9
        ? regionCode
        : regionCode.length >= 6
          ? '156' + regionCode
          : '156' + this.regionCodeFill(regionCode)
    if (this.businessData.length > 0) {
      const data = this.businessData.find(item => {
        return item.code === regionCode
      })
      const scale = (data.value || 0) / (this.maxValue - this.minValue)
      return new Style({
        fill: new Fill({
          color:
            'rgba(' +
            Math.round(this.beginColorRgaArray[0] + this.differenceValue[0] * scale) +
            ',' +
            Math.round(this.beginColorRgaArray[1] + this.differenceValue[1] * scale) +
            ',' +
            Math.round(this.beginColorRgaArray[2] + this.differenceValue[2] * scale) +
            ', 1)'
        }),
        stroke: new Stroke({
          color: '#FF0000',
          width: 2
        }),
        text: new Text({
          text: regionName
        })
      })
    } else {
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.2)'
        }),
        stroke: new Stroke({
          color: '#FF0000',
          width: 2
        }),
        text: new Text({
          text: regionName
        })
      })
    }
  }

  /**
   * 添加点击下钻事件
   */
  addDrillDownInteraction() {
    this.map.on('click', evt => {
      const features = this.map.getFeaturesAtPixel(this.map.getPixelFromCoordinate(evt.coordinate), {
        layerFilter: layer => {
          if (layer.get('id') === 'mapDrillDownLayer') {
            return true
          } else {
            return false
          }
        }
      })
      if (features) {
        this.drillToRegion(features[0].get('regionCode'), () => {
          // 发出下钻事件
          this.map.dispatchEvent(
            new DrillEvent('drillclick', this.map, features[0].get('regionCode'), features[0].get('regionName'))
          )
        })
      }
    })
  }
}

export default RegionDrillDown
