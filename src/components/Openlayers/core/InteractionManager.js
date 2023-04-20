import $ from 'jquery'

/**
 * 地图互动事件管理类
 */
class InteractionManager {
  constructor(map) {
    this.interactions = []
    this.map = map
    this.currentInteraction = {}
    this.init()
  }
  /**
   * 打开地图互动事件
   * @param {*} interactionName 地图互动事件名字
   * @param {*} map 地图对象
   * @param {*} options
   */
  openInteraction(interactionName, options) {
    this.currentInteraction = undefined
    this.interactions.forEach(element => {
      if (element.name === interactionName) {
        this.currentInteraction = element
      } else {
        element.setActive(false)
      }
    })
    // 如果是关闭状态，则打开
    if (!!this.currentInteraction && !this.currentInteraction.active) {
      this.currentInteraction.setActive(true, options)
      // 添加鼠标右键关闭事件
      $(this.map.getViewport()).on('pointerdown', this.mapMouseEvent.bind(this))
    }
    return this.currentInteraction
  }

  /**
   * 关闭地图所有互动事件
   */
  closeInteraction() {
    this.currentInteraction = undefined
    this.interactions.forEach(element => {
      element.setActive(false)
    })
  }

  /**
   * 初始化所有插件
   */
  init() {}

  /**
   * 添加地图互动事件
   * @param {*} interaction
   */
  addInteraction(interaction) {
    this.interactions.push(interaction)
  }

  mapMouseEvent(event) {
    var btnNum = event.button
    if (btnNum === 2) {
      this.currentInteraction.setActive(false)
    }
  }

  /**
   * 根据名字，获取地图互动事件
   * @param {*} name
   */
  getInteractionByName(name) {
    for (let i = 0, l = this.interactions.length; i < l; i++) {
      if (this.interactions[i].name === name) {
        return this.interactions[i]
      }
    }
  }
}

export default InteractionManager
