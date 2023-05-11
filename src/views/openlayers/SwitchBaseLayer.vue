<template>
  <div class="map-container">
    <olMap :tdt-layer-switch-show="false" @mapInitialized="mapInitialized" />
    <div
      style="    position: fixed;
    top: 115px;
    left: 50%;"
    >
      <el-radio-group v-model="tdt" @change="changeType">
        <el-radio-button label="天地图" />
        <el-radio-button label="百度地图" />
        <el-radio-button label="高德地图" />
        <el-radio-button label="arcgis地图" />
      </el-radio-group>
    </div>
  </div>
</template>

<script>
import 'ol-ext/dist/ol-ext.css'
import LayerPopup from 'ol-ext/control/LayerSwitcher'
import olMap from '@/components/Openlayers'

export default {
  name: 'SwitchBaseLayer',
  components: { olMap },
  data() {
    return {
      map: undefined,
      center: [120.1478, 30.2619],
      zoom: 12,
      tdt: '天地图',
      layerObj: {
        '天地图': {
          id: 'cbopd126-609b-loba-3ecc-ea3djk88ccc4',
          label: '全球矢量地图服务',
          type: 'tdt',
          url: 'https://t' + Math.round(Math.random() * 7) + '.tianditu.gov.cn/vec_c/wmts?tk=' + this.tk,
          visibleLayers: ['vec'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        },
        '百度地图': {
          id: 'cbopd126-609b-loba-3ecc-ea3djk88ccc4',
          label: '全球矢量地图服务',
          type: 'BaiduMap',
          // type: 'tdt',
          // url: 'https://t' + Math.round(Math.random() * 7) + '.tianditu.gov.cn/vec_c/wmts?tk=' + this.tk,
          visibleLayers: ['vec'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        },
        '高德地图': {
          id: 'cbopd126-609b-loba-3ecc-ea3djk88ccc4',
          label: '全球矢量地图服务',
          type: 'gaode',
          url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
          visibleLayers: ['vec'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        },
        'arcgis地图': {
          id: 'cbopd126-609b-loba-3ecc-ea3djk88ccc4',
          label: '全球矢量地图服务',
          type: 'tiled',
          // url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer',
          url: 'http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer',
          visibleLayers: ['vec'],
          mapIndex: 0,
          opacity: 1,
          group: 1
        }
      }
    }
  },
  mounted() {

  },
  methods: {
    mapInitialized(map) {
      this.map = map
    },
    changeType(e) {
      this.addLayers(e)
    },
    addLayers(type) {
      this.map.removeTargetLayer(this.layerObj[type])
      this.map.addTargetLayer(this.layerObj[type])
    }
  }
}
</script>

<style scoped>

.map-container{
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
}
</style>

