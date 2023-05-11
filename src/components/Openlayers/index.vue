<template>
  <div style="overflow: hidden;height: 100%;width: 100%;">
    <div ref="map" class="map" :class="{ hasTimeBar: timeBarIsShow }" @contextmenu="preventContentMenu">
      <TDTLayerSwitch v-if="TDTLayerSwitchIsLoad" v-show="tdtLayerSwitchShow" :shinemap="shinemap" />
      <div v-if="regionDrillDownIsLoad" id="regionDrillDown">
        <RegionDrillDown
          :shinemap="shinemap"
          :region-drill-down-data="regionDrillDownData"
          style="padding:5px 3px;"
        />
      </div>
    </div>
    <TimeBar v-if="timeBarIsShow" :shinemap="shinemap" :time-bar-status="timeBarStatus" />
    <Plot v-if="plotShow" :map="shinemap" />
    <!-- <Search v-if="searchShow" :map="shinemap"></Search> -->
    <XZQControl v-if="xzqBarShow" :map="shinemap" />
  </div>
</template>

<script>
import './assets/map.css'
import ShineMap from './core/ShineMap'
import View from 'ol/View.js'
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control.js'
import MousePosition from 'ol/control/MousePosition.js'
import { createStringXY } from 'ol/coordinate.js'
import ResizeSensor from './util/ResizeSensor'

export default {
  // name: 'shinemap',
  components: {
    TDTLayerSwitch: () => import('./module/PageElement/TDTLayerSwitch'),
    RegionDrillDown: () => import('./module/Visualization/RegionDrillDown'),
    TimeBar: () => import('./module/PageElement/TimeBar.vue'),
    Plot: () => import('./module/PageElement/plot.vue'),
    // Search: () => import('./module/Edit/Search.vue'),
    XZQControl: () => import('./module/Visualization/RegionDrillDown/XZQControl.vue')
  },
  props: {
    // 地图对象
    map: {
      type: Object,
      default: undefined
    },
    // 图层配置信息
    config: {
      type: Object,
      default() {
        return {}
      }
    },
    // 地图初始中心点坐标
    center: {
      type: Array,
      default: function() {
        return [120.5, 30]
      }
    },
    // 地图初始缩放等级
    zoom: {
      type: Number,
      default: 4
    },
    // 地图初始坐标系
    projection: {
      type: String,
      default: 'EPSG:4326'
    },
    // WFS图层样式
    layerStyles: {
      type: Array,
      default: function() {
        return []
      }
    },
    // 天地图秘钥
    tdtKey: {
      type: String,
      default: '17d1619c13e4508bc1945bd59de4edf8'
    },
    // 天地图底图快速切换控件
    tdtLayerSwitch: {
      type: Boolean,
      default: true
    },
    // 天地图底图快速切换默认图层
    tdtActiveType: {
      type: String,
      default: 'vec'
    },
    // 天地图底图快速切换注记图层是否加载
    tdtNoteActive: {
      type: Boolean,
      default: true
    },
    tdtLayerSwitchShow: {
      type: Boolean,
      default: true
    },
    // 时间轴是否显示
    timeBar: {
      type: Boolean,
      default: false
    },
    xzqBarShow: {
      type: Boolean,
      default: false
    },
    plotShow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      shinemap: '',
      selected: {
        province: '330000',
        city: '330100',
        area: '330103',
        town: '330103012'
      },
      TDTLayerSwitchIsLoad: false,
      regionDrillDownIsLoad: false,
      timeBarStatus: undefined,
      timeBarIsShow: false,
      regionDrillDownData: [],
      searchShow: true
    }
  },
  beforeDestroy() {
    this.$off('update:map')
    this.$off('mapInitialized')
    this.$off('select')
  },
  mounted() {
    this.creatMap()
  },
  methods: {
    creatMap() {
      this.shinemap = new ShineMap({
        target: this.$refs.map,
        config: this.config,
        layerStyles: this.layerStyles,
        view: new View({
          // extent: [116.32573565, 26.8434226850001, 124.37420269, 31.88255606],
          center: this.center,
          zoom: this.zoom,
          projection: this.projection
        }),
        controls: defaultControls({
          zoomOptions: {
            className: 'ol-zoomPosition'
          }
        }).extend([
          new MousePosition({
            className: 'mousePosition',
            coordinateFormat: createStringXY(4)
          }),
          new ScaleLine(),
          new FullScreen()
        ])
      })
      this.shinemap.set('tdtKey', this.tdtKey)
      this.shinemap.set('tdtActiveType', this.tdtActiveType)
      this.shinemap.set('tdtNoteActive', this.tdtNoteActive)

      /* eslint-disable */
      new ResizeSensor(this.shinemap.getViewport(), () => {
        this.shinemap.updateSize()
      })

      setInterval(() => {
        this.shinemap.updateSize()
      }, 500)

      /* eslint-disable */
      this.$emit('update:map', this.shinemap)
      this.$emit('mapInitialized', this.shinemap)
      this.TDTLayerSwitchIsLoad = this.tdtLayerSwitch
      this.timeBarIsShow = this.timeBar

      // 行政区划下钻的控制条显示
      this.shinemap.on('regionDrillDownDataChange', evt => {
        console.log(evt.frameState);
        this.regionDrillDownData = evt.frameState
        if (evt.frameState && evt.frameState.length > 0) {
          this.regionDrillDownIsLoad = true
        } else {
          this.regionDrillDownIsLoad = false
        }
      })
    },
    regionChange(data) {
      console.log(data)
    },
    preventContentMenu(e) {
      e.preventDefault()
    }
  },
  watch: {
    config(newValue) {
      if (this.shinemap) {
        this.shinemap.configManager.setConfig(newValue)
      }
    },
    layerStyles(newValue) {
      if (this.shinemap) {
        this.shinemap.layerManager.setLayerStyles(newValue)
      }
    }
  }
}
</script>

<style scoped>
.map {
  position: relative;
  overflow: hidden;
  height: 100%;
  width: 100%;
}
.xzq-control{
  position:absolute;
  top: 20px;
  left: 20px;
  background: cornflowerblue;
}
.hasTimeBar {
  height: calc(100% - 36px);
}
#regionDrillDown {
  position: absolute;
  background-color: #fff;
  height: 26px;
  border-radius: 5px;
  z-index: 2;
  top: 3em;
  left: calc(50% - 75px);
}
</style>
