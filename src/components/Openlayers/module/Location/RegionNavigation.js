import $ from 'jquery'
import Feature from 'ol/Feature'
import Polygon from 'ol/geom/Polygon'
import MultiPolygon from 'ol/geom/MultiPolygon'
import { getCenter } from 'ol/extent'

class RegionNavigation {
  constructor(map) {
    this.map = map
    this.url = 'http://api.tianditu.gov.cn/administrative'
  }

  locate(regionCode) {
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
      tk: '17d1619c13e4508bc1945bd59de4edf8'
    }
    $.ajax({
      url: this.url,
      type: 'GET',
      data: params,
      dataType: 'json',
      success: response => {
        this.map.getViewport().style.cursor = 'auto'
        if (response.returncode === '100') {
          // // 清除图层数据
          // this.map.getLayerById('regionLayer').getSource().clear()
          // let feature = this.getFeatureFromPoints(response.data.points)
          // // feature属性信息
          // feature.set('regionCode', this.regionCodeCut(response.data.cityCode))
          // feature.set('regionName', response.data.name)
          // this.map.getLayerById('regionLayer').getSource().addFeature(feature)
          // // 定位
          // this.map.getView().animate({
          //   center: getCenter(feature.getGeometry().getExtent()),
          //   resolution: this.map.getView().getResolutionForExtent(feature.getGeometry().getExtent())
          // })
          const boundarray = response.data.bound.split(',')
          console.log(boundarray)
          const bound = [
            parseFloat(boundarray[0]),
            parseFloat(boundarray[1]),
            parseFloat(boundarray[2]),
            parseFloat(boundarray[3])
          ]
          this.map.getView().animate({
            center: getCenter(bound),
            resolution: this.map.getView().getResolutionForExtent(bound)
          })
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
  // 加载行政区范围，不定位
  locateNotZoom(regionCode) {
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
      tk: '17d1619c13e4508bc1945bd59de4edf8'
    }
    $.ajax({
      url: this.url,
      type: 'GET',
      data: params,
      dataType: 'json',
      success: response => {
        this.map.getViewport().style.cursor = 'auto'
        if (response.returncode === '100') {
          // 清除图层数据
          this.map
            .getLayerById('regionLayer')
            .getSource()
            .clear()
          const feature = this.getFeatureFromPoints(response.data.points)
          // feature属性信息
          feature.set('regionCode', this.regionCodeCut(response.data.cityCode))
          feature.set('regionName', response.data.name)
          this.map
            .getLayerById('regionLayer')
            .getSource()
            .addFeature(feature)
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

export default RegionNavigation
