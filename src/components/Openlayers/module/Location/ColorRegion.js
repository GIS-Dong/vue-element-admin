import $ from 'jquery'
import Feature from 'ol/Feature'
import Polygon from 'ol/geom/Polygon'
import MultiPolygon from 'ol/geom/MultiPolygon'
import { extend, getCenter } from 'ol/extent'
import { Text, Fill, Stroke, Style } from 'ol/style.js'
import { hexToRgba } from '../../../util/common'

class ColorRegion {
  constructor(map, config) {
    this.map = map
    // 业务数据最小值
    this.minValue = config.min || 0
    // 业务数据最大值
    this.maxValue = config.max || 0
    // 起始颜色
    this.beginColor = config.colors && config.colors.length > 1 ? config.colors[0] : '#F7FF00'
    // 结束颜色
    this.endColor = config.colors && config.colors.length > 1 ? config.colors[1] : '#FF0400'
    // 业务数据
    this.businessData = config.data ? this.transRegionCode(config.data) : []
    // 起始颜色的rgb数值的数组
    this.beginColorRgaArray = this.getBeginColorRgaArray(this.transToRgba(this.beginColor))
    // 起始颜色与结束颜色rgb的差值
    this.differenceValue = this.getDifferenceColorValue(
      this.transToRgba(this.beginColor),
      this.transToRgba(this.endColor)
    )
    this.url = 'http://api.tianditu.gov.cn/administrative'
  }

  addColorRegion(regionCode) {
    // 设置图层样式
    this.map.getLayerById('colorRegionLayer').setStyle(feature => {
      return this.getColorRegionStyle(feature.get('regionCode'), feature.get('regionName'))
    })
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
        this.map.getViewport().style.cursor = 'auto'
        if (response.returncode === '100') {
          // 判断是否有下一级数据
          if (response.data.child) {
            // 清除展示图层数据
            this.map
              .getLayerById('colorRegionLayer')
              .getSource()
              .clear()
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
                .getLayerById('colorRegionLayer')
                .getSource()
                .addFeature(feature)
            })
            // 定位
            this.map.getView().animate({
              center: getCenter(extent),
              resolution: this.map.getView().getResolutionForExtent(extent)
            })
          } else {
            // 当前行政区划面没有子节点数据时，则显示当前行政区划
            // 清除图层数据
            this.map
              .getLayerById('colorRegionLayer')
              .getSource()
              .clear()
            const feature = this.getFeatureFromPoints(response.data.points)
            // feature属性信息
            feature.set('regionCode', this.regionCodeCut(response.data.cityCode))
            feature.set('regionName', response.data.name)
            this.map
              .getLayerById('colorRegionLayer')
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
   * 获取渐变色行政区划图层的样式
   * @param {*} regionCode 行政区划编码
   * @param {*} regionName 行政区划名称
   */
  getColorRegionStyle(regionCode, regionName) {
    regionCode =
      regionCode.length === 9
        ? regionCode
        : regionCode.length >= 6
          ? '156' + regionCode
          : '156' + this.regionCodeFill(regionCode)
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
          ', 0.6)'
      }),
      stroke: new Stroke({
        color: '#04387b',
        width: 2
      }),
      text: new Text({
        text: regionName
      })
    })
  }

  /**
   * 颜色转换成RGB格式
   * @param {*} color 颜色代码
   */
  transToRgba(color) {
    const reg = /^#[\da-f]{3}([\da-f]{3})?$/i
    if (reg.test(color)) {
      return hexToRgba(color)
    } else if (color.toLowerCase().indexOf('rba') > -1) {
      return color
    } else {
      console.error('不能识别的颜色代码格式:' + color)
    }
  }

  /**
   * 获取rgb颜色数值生成的数组
   * @param {*} color rgb颜色
   */
  getBeginColorRgaArray(color) {
    const colorArray = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(',')
    return [Number(colorArray[0]), Number(colorArray[1]), Number(colorArray[2])]
  }

  /**
   * 获取起始颜色与结束颜色rga的差值
   * @param {*} beginColor 起始颜色
   * @param {*} endColor 结束颜色
   */
  getDifferenceColorValue(beginColor, endColor) {
    const beginColorArray = beginColor.substring(beginColor.indexOf('(') + 1, beginColor.indexOf(')')).split(',')
    const endColorArray = endColor.substring(endColor.indexOf('(') + 1, endColor.indexOf(')')).split(',')
    return [
      Number(endColorArray[0]) - Number(beginColorArray[0]),
      Number(endColorArray[1]) - Number(beginColorArray[1]),
      Number(endColorArray[2]) - Number(beginColorArray[2])
    ]
  }

  /**
   * 将业务数据中的行政区划编码转换成天地图标准格式的行政区划编码
   * @param {*} data 业务数据
   */
  transRegionCode(data) {
    const temp = []
    for (let i = 0; i < data.length; i++) {
      temp.push({
        code:
          data[i].code.length === 9
            ? data[i].code
            : data[i].code.length >= 6
              ? '156' + data[i].code
              : '156' + this.regionCodeFill(data[i].code),
        value: data[i].value
      })
    }
    return temp
  }

  /**
   * 将天地图接口返回坐标数据转成feature
   * @param {*} points 天地图接口返回坐标数据
   */
  getFeatureFromPoints(points) {
    let multiPolygon
    points.forEach((str, j) => {
      const coordinates = []
      // 坐标格式转换
      str.region.split(',').forEach(point => {
        coordinates.push([Number(point.split(' ')[0]), Number(point.split(' ')[1])])
      })
      if (j === 0) {
        multiPolygon = new MultiPolygon([[coordinates]])
      } else {
        multiPolygon.appendPolygon(new Polygon([coordinates]))
      }
    })
    const feature = new Feature({
      geometry: multiPolygon
    })
    return feature
  }

  /**
   * 天地图接口需要6位行政区划代码，不够则补0
   * @param {*} regionCode 行政区划代码
   */
  regionCodeFill(regionCode) {
    while (regionCode.length < 6) {
      regionCode += '0'
    }
    return regionCode
  }

  /**
   * 行政区划代码裁剪，去除填充
   * @param {*} regionCode 行政区划代码
   */
  regionCodeCut(regionCode) {
    regionCode = regionCode.substring(3, regionCode.length)
    // 行政区划代码都为双位数，所以这里检索'00'的数量
    let count = 0
    for (let i = regionCode.length; i >= 0; i -= 2) {
      const temp = regionCode
      if (temp.substring(i - 2, i) === '00') {
        count++
      } else {
        break
      }
    }
    return regionCode.substring(0, regionCode.length - count * 2)
  }
}

export default ColorRegion
