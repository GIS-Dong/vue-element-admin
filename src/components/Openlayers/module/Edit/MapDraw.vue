<template>
  <div id="hgxfxBox" style="overflow: hidden;height: 100%;width: 100%;">
    <div ref="map" class="map" :class="{ hasTimeBar: timeBarIsShow }" @contextmenu="preventContentMenu">
      <TDTLayerSwitch v-if="TDTLayerSwitchIsLoad" v-show="tdtLayerSwitchShow" :shinemap="shinemap" />
      <Nav v-if="navShow" :map="map" />
      <Search v-if="searchShow" :map="map" />
    </div>
  </div>
</template>

<script>
import '@/ShineMap/assets/map.css'
import ShineMap from '@/ShineMap/core/ShineMap'
import View from 'ol/View.js'
import { defaults as defaultControls, ScaleLine } from 'ol/control.js'
import MousePosition from 'ol/control/MousePosition.js'
import { createStringXY } from 'ol/coordinate.js'
import Nav from './MapDrawNav.vue'
import Search from './Search.vue' // 搜索框
import ResizeSensor from '@/ShineMap/util/ResizeSensor'
export default {
  name: 'Shinemap',

  components: {
    Nav,
    Search,
    TDTLayerSwitch: () => import('@/ShineMap/module/PageElement/TDTLayerSwitch')
  },

  props: {
    // 地图对象
    map: {
      type: undefined,
      default: undefined
    },
    // 图层配置信息
    config: {
      type: Object,
      default: undefined
    },
    // 地图初始中心点坐标
    center: {
      type: Array,
      default: function() {
        return [103, 30]
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
      default: 'EPSG:4490'
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
    tdtLayerSwitchShow: {
      type: Boolean,
      default: true
    },
    // 天地图底图快速切换默认图层
    tdtActiveType: {
      type: String,
      default: 'img'
    },
    // 天地图底图快速切换注记图层是否加载
    tdtNoteActive: {
      type: Boolean,
      default: true
    },
    // 时间轴是否显示
    timeBar: {
      type: Boolean,
      default: false
    },
    navShow: {
      type: Boolean,
      default: true
    },
    searchShow: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      shinemap: undefined,
      TDTLayerSwitchIsLoad: false,
      regionDrillDownIsLoad: false,
      timeBarStatus: undefined,
      timeBarIsShow: false,
      regionDrillDownData: []
    }
  },

  watch: {
    shinemap(newValue) {
      /* eslint-disable */
      // new ResizeSensor(this.shinemap.getViewport(), () => {
      //   this.shinemap.updateSize()
      // })
    }
  },

  methods: {
    creatMap () {
      this.shinemap = new ShineMap({
        target: this.$refs.map,
        config: this.config,
        layerStyles: this.layerStyles,
        view: new View({
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
          new ScaleLine()
        ])
      })
      // this.shinemap.set('tdtKey', this.tdtKey)
      // this.shinemap.set('tdtActiveType', this.tdtActiveType)
      // this.shinemap.set('tdtNoteActive', this.tdtNoteActive)

      /* eslint-disable */
      this.$emit('update:map', this.shinemap)
      this.$emit('mapInitialized', this.shinemap)
      this.TDTLayerSwitchIsLoad = this.tdtLayerSwitch
    },
    preventContentMenu (e) {
      e.preventDefault();
    },
  },

  mounted () {
    this.creatMap()
  },

  beforeDestroy () {
    this.$off('update:map')
    this.$off('mapInitialized')
    this.$off('select')
  }
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
