/**
 * 地图配置管理
 */
class ConfigManager {
  constructor(map, config) {
    this.map = map
    this.config = config
    this.initCheckedLayers = []
    this.init()
  }

  init() {
    if (this.config && this.config.layers) {
      this.getInitCheckedLayer(this.config.layers)
    }
  }

  /**
   * 查找初始加载图层
   * @param {*} layersInfo
   */
  getInitCheckedLayer(layersInfo) {
    layersInfo.forEach(element => {
      if (element.url && element.url !== '' && element.initChecked === true) {
        this.map.addTargetLayer(element)
        this.initCheckedLayers.push(element.id)
      } else if (element.children && element.children.length > 0) {
        this.getInitCheckedLayer(element.children)
      }
    })
  }

  /**
   * 设置配置信息
   * @param {*} config 配置信息
   */
  setConfig(config) {
    this.config = config
    this.initCheckedLayers = []
    this.init()
  }

  /**
   * 获取图层配置信息
   */
  getlayersConfig() {
    return this.config.layers
  }

  /**
   * 获取初始选中的图层的ID
   */
  getInitCheckedLayers() {
    return this.initCheckedLayers
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return this.config
  }

  /**
   * 获取天地图秘钥
   */
  getTDTKey() {
    return this.config.TDT_KEY
  }
}

export default ConfigManager
