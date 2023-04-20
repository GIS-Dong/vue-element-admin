import Map from 'ol/Map.js'
import 'ol/ol.css'
import './Projection'
import ConfigManager from './ConfigManager'
import LayerManager from './LayerManager/index'
import locationImg from '../assets/img/location.png'

class ShineMap extends Map {
  constructor(options) {
    super(options)
    // 图层管理
    this.layerManager = new LayerManager(this, options.layerStyles)
    // 配置管理
    this.configManager = new ConfigManager(this, options.config)
    // 行政区划下钻
    this.mapDrillDown = undefined
  }

  /**
   * 添加图层
   * @param {*} option 图层配置信息
   */
  addTargetLayer(option) {
    this.layerManager.addLayer(option)
  }

  /**
   * 删除图层
   * @param {*} option 图层配置信息
   */
  removeTargetLayer(option) {
    this.layerManager.removeLayer(option)
  }

  /**
   * 根据图层ID查找图层
   * @param {*} id 图层ID
   */
  getLayerById(id) {
    let layer
    const layers = this.getLayers().getArray()
    for (let i = 0; i < layers.length; i++) {
      const tempLayerId = layers[i].get('id')
      if (tempLayerId === id) {
        layer = layers[i]
        break
      }
    }
    return layer
  }

  /**
   * 根据图层layerTag查找图层
   * @param {*} layerTag 图层标志
   */
  getLayerByLayerTag(layerTag) {
    let layer
    const layers = this.getLayers().getArray()
    for (let i = 0; i < layers.length; i++) {
      const tempLayerTag = layers[i].get('layerTag')
      if (tempLayerTag === layerTag) {
        layer = layers[i]
        break
      }
    }
    return layer
  }

  /**
   * 获取绘制图层
   */
  getDrawLayer() {
    return this.getLayerById('drawLayer')
  }

  /**
   * 获取定位图层
   */
  getLocateLayer() {
    return this.getLayerById('locateLayer')
  }

  /**
   * 查询定位
   * @param {*} layerTag 定位图层标志
   * @param {*} where 定位条件
   * @param {*} style 定位样式
   */
  queryToLocate(layerTag, where, style, thisobj) {
    Promise.all([
      import('../util/tasks/QueryTask'),
      import('../util/tasks/QueryParameters'),
      import('ol/format/GeoJSON'),
      import('ol/style.js'),
      import('ol/extent')
    ]).then(
      ([
        { default: QueryTask },
        { default: QueryParameters },
        { default: GeoJSON },
        { Style, Icon },
        { getCenter }
      ]) => {
        let layerOption
        const layersInfo = this.configManager.getlayersConfig()

        function getTargetlayerInfo(layers) {
          if (layerOption) {
            return
          }
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].layerTag && layers[i].layerTag === layerTag) {
              layerOption = layers[i]
              return
            } else if (layers[i].children && layers[i].children.length > 0) {
              getTargetlayerInfo(layers[i].children)
            }
          }
        }
        getTargetlayerInfo(layersInfo)
        if (!layerOption) {
          console.error(`未找到图层标志为:${layerTag}的图层配置信息`)
          return
        }
        const queryTask = new QueryTask(layerOption)
        const params = new QueryParameters()
        // 查询条件
        params.where = where
        queryTask
          .execute(params)
          .then(response => {
            // 清除定位图层
            this.getLocateLayer()
              .getSource()
              .clear()
            if (response.features && response.features.length > 0) {
              const geojsonFormat = new GeoJSON()
              const feature = geojsonFormat.readFeature(response.features[0])
              if (feature.getGeometry()) {
                if (style) {
                  // feature.setStyle(style)
                  this.getLocateLayer().setStyle(style)
                  for (let i = 0; i < response.features.length; i++) {
                    const features = geojsonFormat.readFeature(response.features[i])
                    this.getLocateLayer()
                      .getSource()
                      .addFeature(features)
                  }
                } else {
                  feature.setStyle(
                    new Style({
                      image: new Icon({
                        size: [36, 36],
                        src: locationImg,
                        anchor: [0.5, 1]
                      })
                    })
                  )
                  this.getLocateLayer()
                    .getSource()
                    .addFeature(feature)
                }
                // 定位到目标feature
                this.getView().animate({
                  center: getCenter(
                    this.getLocateLayer()
                      .getSource()
                      .getExtent()
                  ),
                  resolution: this.getView().getResolutionForExtent(
                    this.getLocateLayer()
                      .getSource()
                      .getExtent(),
                    [this.getSize()[0], this.getSize()[1]]
                  ),
                  duration: 1000
                })
                // if(feature.getGeometry().getType()=='Point'||feature.getGeometry().getType()=='MultiPolygon'||feature.getGeometry().getGeometries()[0].getType()=='Point'){
                //   this.getView().animate({
                //     center: getCenter(this.getLocateLayer().getSource().getExtent()),
                //     zoom:17,
                //     // resolution: this.getView().getResolutionForExtent(this.getLocateLayer().getSource().getExtent(), [this.getSize()[0] * 0.2, this.getSize()[1] * 0.2]),
                //     duration: 1000
                //   })
                // }else{
                //   this.getView().animate({
                //     center: getCenter(this.getLocateLayer().getSource().getExtent()),
                //     resolution: this.getView().getResolutionForExtent(this.getLocateLayer().getSource().getExtent(), [this.getSize()[0], this.getSize()[1]]),
                //     duration: 1000
                //   })
                // }
              } else {
                if (thisobj) {
                  thisobj.$message({
                    message: '没有位置信息!!!',
                    type: 'warning'
                  })
                }
              }
            } else {
              if (thisobj) {
                thisobj.$message({
                  message: '没有位置信息!!!',
                  type: 'warning'
                })
              }
            }
          })
          .catch(error => {
            console.error(error)
          })
      }
    )
  }

  /**
   * 查询不定位
   * @param {*} layerTag 定位图层标志
   * @param {*} where 定位条件
   * @param {*} style 定位样式
   */
  queryFeature(layerTag, where, style, thisobj) {
    Promise.all([
      import('../util/tasks/QueryTask'),
      import('../util/tasks/QueryParameters'),
      import('ol/format/GeoJSON'),
      import('ol/style.js'),
      import('ol/extent')
    ]).then(([{ default: QueryTask }, { default: QueryParameters }, { default: GeoJSON }, { Style, Icon }]) => {
      let layerOption
      const layersInfo = this.configManager.getlayersConfig()

      function getTargetlayerInfo(layers) {
        if (layerOption) {
          return
        }
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].layerTag && layers[i].layerTag === layerTag) {
            layerOption = layers[i]
            return
          } else if (layers[i].children && layers[i].children.length > 0) {
            getTargetlayerInfo(layers[i].children)
          }
        }
      }
      getTargetlayerInfo(layersInfo)
      if (!layerOption) {
        console.error(`未找到图层标志为:${layerTag}的图层配置信息`)
        return
      }
      const queryTask = new QueryTask(layerOption)
      const params = new QueryParameters()
      // 查询条件
      params.where = where
      queryTask
        .execute(params)
        .then(response => {
          // 清除定位图层
          this.getLocateLayer()
            .getSource()
            .clear()
          if (response.features && response.features.length > 0) {
            const geojsonFormat = new GeoJSON()
            const feature = geojsonFormat.readFeature(response.features[0])
            if (feature.getGeometry()) {
              if (style) {
                this.getLocateLayer().setStyle(style)
                for (let i = 0; i < response.features.length; i++) {
                  const features = geojsonFormat.readFeature(response.features[i])
                  this.getLocateLayer()
                    .getSource()
                    .addFeature(features)
                }
              } else {
                feature.setStyle(
                  new Style({
                    image: new Icon({
                      size: [36, 36],
                      src: locationImg,
                      anchor: [0.5, 1]
                    })
                  })
                )
                this.getLocateLayer()
                  .getSource()
                  .addFeature(feature)
              }
              // 定位到目标feature
              // this.getView().animate({
              //   center: getCenter(this.getLocateLayer().getSource().getExtent()),
              //   resolution: this.getView().getResolutionForExtent(this.getLocateLayer().getSource().getExtent(), [this.getSize()[0], this.getSize()[1]]),
              //   duration: 1000
              // })
            } else {
              if (thisobj) {
                thisobj.$message({
                  message: '没有位置信息!!!',
                  type: 'warning'
                })
              }
            }
          } else {
            if (thisobj) {
              thisobj.$message({
                message: '没有位置信息!!!',
                type: 'warning'
              })
            }
          }
        })
        .catch(error => {
          console.error(error)
        })
    })
  }

  /**
   *
   * @param {*} layerTag 图层标记
   * @param {*} where 过滤条件
   * @param {*} style 样式
   */
  filterFeatures(layerTag, where) {
    Promise.all([
      import('../util/tasks/QueryTask'),
      import('../util/tasks/QueryParameters'),
      import('ol/format/GeoJSON'),
      import('ol/style.js'),
      import('ol/extent')
    ]).then(() => {
      // 清除定位图层
      this.getLocateLayer()
        .getSource()
        .clear()

      let layerOption
      const layersInfo = this.configManager.getlayersConfig()

      for (let i = 0; i < layersInfo.length; i++) {
        if (layersInfo[i].layerTag && layersInfo[i].layerTag === layerTag) {
          // layerOption = layers[i]
          layersInfo[i].filter = where
          layerOption = layersInfo[i]
          this.removeTargetLayer(layerOption)
          this.addTargetLayer(layerOption)
        }
      }
    })
  }

  /**
   * 行政区划代码----------------本地服务行政区
   * @param {*} regionCode 行政区划代码
   */
  fitToRegion(layerTag, regionCode) {
    Promise.all([
      import('../util/tasks/QueryTask'),
      import('../util/tasks/QueryParameters'),
      import('ol/format/GeoJSON'),
      import('ol/style.js'),
      import('ol/extent')
    ]).then(([{ default: QueryTask }, { default: QueryParameters }, { default: GeoJSON }, { getCenter }]) => {
      let layerOption
      const layersInfo = this.configManager.getlayersConfig()

      function getTargetlayerInfo(layers) {
        if (layerOption) {
          return
        }
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].layerTag && layers[i].layerTag === layerTag) {
            layerOption = layers[i]
            return
          } else if (layers[i].children && layers[i].children.length > 0) {
            getTargetlayerInfo(layers[i].children)
          }
        }
      }
      getTargetlayerInfo(layersInfo)
      if (!layerOption) {
        console.error(`未找到图层标志为:${layerTag}的图层配置信息`)
        return
      }
      const queryTask = new QueryTask(layerOption)
      const params = new QueryParameters()
      // 查询条件
      params.where = 'XZQDM=' + regionCode
      queryTask
        .execute(params)
        .then(response => {
          const fitLayer = this.getDrawLayer()
          // 清除定位图层
          fitLayer.getSource().clear()
          if (response.features.length > 0) {
            const geojsonFormat = new GeoJSON()
            for (let i = 0; i < response.features.length; i++) {
              const features = geojsonFormat.readFeature(response.features[i])
              fitLayer.getSource().addFeature(features)
            }
            fitLayer.setVisible(false)
            // 定位到目标feature
            this.getView().animate({
              center: getCenter(fitLayer.getSource().getExtent()),
              resolution: this.getView().getResolutionForExtent(fitLayer.getSource().getExtent(), [
                this.getSize()[0],
                this.getSize()[1]
              ]),
              duration: 1000
            })
          }
        })
        .catch(error => {
          console.error(error)
        })
    })
  }

  /**
   * 行政区划代码----------------天地图在线行政区
   * @param {*} regionCode 行政区划代码
   */
  locateToRegion(regionCode) {
    import('../module/RegionNavigation/RegionNavigation.js')
      .then(({ default: RegionNavigation }) => {
        const regionNavigation = new RegionNavigation(this, regionCode)
        regionNavigation.locate(regionCode)
      })
      .catch(error => {
        console.error(error)
      })
  }

  /**
   * 添加行政区划下钻图层
   * @param {*} regionCode 行政区划代码
   * @param {*} callBack 下钻成功的回调事件
   */
  addDrillRegion(regionCode, config, callBack) {
    if (this.mapDrillDown) {
      this.mapDrillDown.drillToRegion(regionCode, callBack)
    } else {
      import('../module/Visualization/RegionDrillDown/RegionDrillDown.js')
        .then(({ default: MapDrillDown }) => {
          this.mapDrillDown = new MapDrillDown(this, config)
          this.mapDrillDown.drillToRegion(regionCode, callBack)
        })
        .catch(error => {
          console.error(error)
        })
    }
  }

  /**
   * 添加Echarts可视化图层
   * @param {*} option echarts配置
   */
  addEchartsLayer(option) {
    return import('ol-echarts')
      .then(({ default: EChartsLayer }) => {
        const echartslayer = new EChartsLayer(option)
        echartslayer.appendTo(this)
        return echartslayer
      })
      .catch(error => {
        console.error(error)
      })
  }

  /**
   * 删除Echarts可视化图层
   * @param {*} echartsLayer EChartsLayer
   */
  removeEchartsLayer(echartsLayer) {
    echartsLayer.remove()
  }

  /**
   * 添加渐变色行政区划
   * @param {string} regionCode 行政区划代码
   * @param {object} config 配置信息
   */
  addColorRegion(regionCode, config) {
    import('../module/Visualization/ColorRegion/ColorRegion.js')
      .then(({ default: ColorRegion }) => {
        const colorRegion = new ColorRegion(this, config)
        colorRegion.addColorRegion(regionCode)
      })
      .catch(error => {
        console.error(error)
      })
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
}

export default ShineMap
