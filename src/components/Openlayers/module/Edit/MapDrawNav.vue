<template>
  <el-menu
    id="navigation"
    class="el-menu-vertial-demo"
    :default-active="activeIndex"
    :collapse="true"
    @select="handleSelect"
  >
    <el-menu-item v-show="false" index="test">
      <i class="el-icon-location-outline" />
      <span slot="title" />
    </el-menu-item>
    <el-submenu index="1">
      <template slot="title">
        <i class="el-icon-edit" />
        <span slot="title">绘制</span>
      </template>
      <el-menu-item index="1-1" :disabled="pointDisabled">点</el-menu-item>
      <el-menu-item index="1-2" :disabled="polylineDisabled">线</el-menu-item>
      <el-menu-item index="1-3" :disabled="polygonDisabled">面</el-menu-item>
    </el-submenu>
    <!-- <el-menu-item index="5"
                  :disabled="importDisabled"
                  title="导入位置信息">
      <i class="el-icon-aliicon-fileImport"></i>
      <span slot="title">导入位置信息</span>
    </el-menu-item> -->
    <!-- <el-menu-item index="2"
                  :disabled="editDisabled"
                  title="将鼠标放置在图形边线上时,出现编辑点;拖拽编辑点,可编辑当前图形;">
      <i class="el-icon-edit-outline"></i>
      <span slot="title">编辑</span>
    </el-menu-item> -->
    <el-menu-item index="3" :disabled="deleteDisabled" title="清除">
      <i class="el-icon-delete" />
      <span slot="title">清除</span>
    </el-menu-item>
    <!-- <el-menu-item index="4"
                  :disabled="saveDisabled"
                  title="保存">
      <i class="el-icon-check"></i>
      <span slot="title">保存</span>
    </el-menu-item> -->
  </el-menu>
</template>

<script>
import $ from 'jquery'
import { Draw, Modify, Snap } from 'ol/interaction.js'
import WKT from 'ol/format/WKT'
import Bus from '@/ShineMap/util/bus.js'
import GeometryCollection from 'ol/geom/GeometryCollection'
import Feature from 'ol/Feature'
import locationIcon from '@/ShineMap/assets/img/location.png'
import { Style, Fill, Stroke, Icon } from 'ol/style'
import { getCenter } from 'ol/extent'

export default {
  props: {
    map: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      activeIndex: '',
      pointDisabled: false,
      polylineDisabled: false,
      polygonDisabled: false,
      geometryType: undefined,
      importDisabled: false,
      editDisabled: true,
      saveDisabled: true,
      deleteDisabled: false,
      regionCodes: undefined,
      navBar: '',
      isFitToRegion: true // 是否缩放到行政区划位置
    }
  },
  computed: {
    features() {
      return this.map instanceof Map && this.map.getLayerById('drawLayer')
        ? this.map
          .getLayerById('drawLayer')
          .getSource()
          .getFeatures().length
        : 0
    }
  },
  watch: {
    features(curVal, oldVal) {
      if (curVal > 0) {
        this.editDisabled = false
        this.saveDisabled = false
        this.deleteDisabled = false
      } else {
        this.editDisabled = true
        this.saveDisabled = true
        this.deleteDisabled = true
      }
    }
  },
  mounted() {
    this.regionCodes = decodeURI(this.$route.params.regionCodes)
    this.navBar = decodeURI(this.$route.params.navBar)
    if (this.navBar === 'show') {
      $('#navigation').show()
    } else if (this.navBar === 'hide') {
      $('#navigation').hide()
    }
    // 回显
    // const mapCheck = setInterval(() => {
    //   if (this.map instanceof Map) {
    //     clearInterval(mapCheck)
    //     const href = window.location.href
    //     if (href.indexOf('wkt=') > 0) {
    //       //回显
    //       const wktParam = href.substring(href.indexOf('wkt=') + 4, href.length)
    //       if (wktParam.trim() !== '' && wktParam.trim() !== undefined) {
    //         this.drawByWKT(decodeURI(wktParam))
    //         this.isFitToRegion = false
    //       }
    //     }
    //     //行政区划定位
    //     this.fitToRegion()
    //   }
    // }, 200)
    Bus.$on('lookFeatures', wktstring => {
      this.map.render()
      this.drawByWKT(wktstring)
    })
    Bus.$on('showMapEditBar', params => {
      if (params.showBar) {
        $('#navigation').show()
        // this.drawByWKT(params.wktString)
      } else {
        $('#navigation').hide()
        // this.drawByWKT(params.wktString)
      }
    })
    Bus.$on('setActiveIndex', index => {
      if (index) {
        this.activeIndex = '' + index
      } else {
        this.activeIndex = 'test'
      }
    })
  },
  beforeDestroy() {
    Bus.$off('tranformFeatures')
  },
  methods: {
    handleSelect(key, keyPath) {
      this.activeIndex = key
      if (keyPath[0] === '1') {
        // 绘制
        if (keyPath[1] === '1-1') {
          this.geometryType = 'Point'
          this.polylineDisabled = true
          this.polygonDisabled = true
        } else if (keyPath[1] === '1-2') {
          this.geometryType = 'LineString'
          this.pointDisabled = true
          this.polygonDisabled = true
        } else if (keyPath[1] === '1-3') {
          this.geometryType = 'Polygon'
          this.pointDisabled = true
          this.polylineDisabled = true
        }
        // this.map.clearMapEvent();
        // 添加鼠标右键关闭事件
        // $(this.map.getViewport()).on('pointerdown', evt => {
        //   if (evt.button ==== 2) {
        //     this.map.clearMapEvent();
        //   }
        // })
        const draw = new Draw({
          source: this.map.getLayerById('drawLayer').getSource(),
          type: this.geometryType
        })
        draw.on('drawend', evt => {
          this.activeIndex = 'test'
          setTimeout(() => {
            this.deleteDisabled = false
            this.saveFeatures()
          }, 100)
        })
        this.map.addInteraction(draw)
        const modify = new Modify({
          source: this.map.getLayerById('drawLayer').getSource()
        })
        modify.on('modifyend', evt => {
          setTimeout(() => {
            this.deleteDisabled = false
            this.saveFeatures()
          }, 100)
        })
        const snap = new Snap({
          source: this.map.getLayerById('drawLayer').getSource()
        })
        this.map.addInteraction(snap)
        this.map.addInteraction(modify)
        // this.map.addMapEvent(draw);
      } else if (keyPath[0] === '2') {
        // this.map.clearMapEvent();
        const modify = new Modify({
          source: this.map.getLayerById('drawLayer').getSource()
        })
        const snap = new Snap({
          source: this.map.getLayerById('drawLayer').getSource()
        })
        this.map.addInteraction(snap)
        this.map.addInteraction(modify)
        // this.map.addMapEvent([snap, modify]);
      } else if (keyPath[0] === '3') {
        // this.map.clearMapEvent();
        // console.log(this.map.getInteractions().getArray()[9] instanceof Draw)
        for (var i = 0; i < this.map.getInteractions().getArray().length; i++) {
          if (this.map.getInteractions().getArray()[i] instanceof Draw) {
            console.log(this.map.getInteractions().getArray()[i])
            this.map.removeInteraction(this.map.getInteractions().getArray()[i])
          }
        }
        this.map
          .getLayerById('drawLayer')
          .getSource()
          .clear()
        this.pointDisabled = false
        this.polylineDisabled = false
        this.polygonDisabled = false

        setTimeout(() => {
          this.saveFeatures()
        }, 100)
      } else if (keyPath[0] === '4') {
        // 保存
        // this.map.clearMapEvent();
        // 判断是否有绘制点
        // if (this.map.getLayerById("drawLayer").getSource().getFeatures().length === 0) {
        //   this.$message({
        //     showClose: true,
        //     message: "当前地图未发现绘制信息需保存！",
        //     type: "warning"
        //   });
        // } else {
        this.activeIndex = 'test'
        const wkt_c = new WKT()
        const features = this.map
          .getLayerById('drawLayer')
          .getSource()
          .getFeatures()
        let geometryArray = []
        features.forEach(e => {
          if (e.getGeometry().getType() === 'GeometryCollection') {
            geometryArray = e.getGeometry().getGeometries()
          } else {
            geometryArray.push(e.getGeometry())
          }
        })
        const featureCollection = new GeometryCollection(geometryArray)
        const projectFeature = new Feature({
          geometry: featureCollection,
          name: 'projectFeature'
        })
        // let wktstring = wkt_c.writeFeatures(this.map.getLayerById("drawLayer").getSource().getFeatures());
        const wktstring = wkt_c.writeFeature(projectFeature)
        this.$message({
          showClose: true,
          message: '保存成功！',
          type: 'success'
        })
        if (
          this.map
            .getLayerById('drawLayer')
            .getSource()
            .getFeatures().length > 0
        ) {
          window.parent.postMessage({ type: 'save', wkt: wktstring }, '*')
        } else {
          window.parent.postMessage({ type: 'save', wkt: '' }, '*')
        }
        // }
      } else if (keyPath[0] === 5) {
        if ($('#fileImportCard').is(':hidden')) {
          $('#fileImportCard').show()
        } else {
          $('#fileImportCard').hide()
          this.activeIndex = 'test'
        }
      }
    },
    drawByWKT(wkt) {
      this.map
        .getLayerById('drawLayer')
        .getSource()
        .clear()
      if (wkt === null || wkt === '') {
        // this.msgWarning('暂无地理信息')
        return
      }
      const wktString = decodeURI(decodeURI(wkt))
      const wkt_c = new WKT()
      const feature = wkt_c.readFeature(wktString)
      feature.setStyle(
        new Style({
          image: new Icon({
            src: locationIcon,
            anchor: [0.5, 1],
            scale: 0.8
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0)'
          }),
          stroke: new Stroke({
            color: '#FF0000',
            width: 2
          })
        })
      )
      this.map
        .getLayerById('drawLayer')
        .getSource()
        .addFeature(feature)
      // 定位
      // this.map.getView().fit(feature.getGeometry().getExtent(), { duration: 1000 })
      this.map.getView().animate({
        center: getCenter(
          this.map
            .getLayerById('drawLayer')
            .getSource()
            .getExtent()
        ),
        resolution: this.map.getView().getResolutionForExtent(
          this.map
            .getLayerById('drawLayer')
            .getSource()
            .getExtent(),
          [this.map.getSize()[0], this.map.getSize()[1]]
        ),
        duration: 1000
      })
      if (feature.getGeometry().getType() === 'Point') {
        this.geometryType = 'Point'
        this.polylineDisabled = true
        this.polygonDisabled = true
      } else if (feature.getGeometry().getType() === 'LineString') {
        this.geometryType = 'LineString'
        this.pointDisabled = true
        this.polygonDisabled = true
      } else if (feature.getGeometry().getType() === 'Polygon') {
        this.geometryType = 'Polygon'
        this.pointDisabled = true
        this.polylineDisabled = true
      } else if (feature.getGeometry().getType() === 'GeometryCollection') {
        if (
          feature
            .getGeometry()
            .getGeometries()[0]
            .getType() === 'Point'
        ) {
          this.geometryType = 'Point'
          this.polylineDisabled = true
          this.polygonDisabled = true
        } else if (
          feature
            .getGeometry()
            .getGeometries()[0]
            .getType() === 'LineString'
        ) {
          this.geometryType = 'LineString'
          this.pointDisabled = true
          this.polygonDisabled = true
        } else if (
          feature
            .getGeometry()
            .getGeometries()[0]
            .getType() === 'Polygon'
        ) {
          this.geometryType = 'Polygon'
          this.pointDisabled = true
          this.polylineDisabled = true
        } else if (
          feature
            .getGeometry()
            .getGeometries()[0]
            .getType() === 'GeometryCollection'
        ) {
          if (
            feature
              .getGeometry()
              .getGeometries()[0]
              .getGeometries()[0]
              .getType() === 'Point'
          ) {
            this.geometryType = 'Point'
            this.polylineDisabled = true
            this.polygonDisabled = true
          } else if (
            feature
              .getGeometry()
              .getGeometries()[0]
              .getGeometries()[0]
              .getType() === 'LineString'
          ) {
            this.geometryType = 'LineString'
            this.pointDisabled = true
            this.polygonDisabled = true
          } else if (
            feature
              .getGeometry()
              .getGeometries()[0]
              .getGeometries()[0]
              .getType() === 'Polygon'
          ) {
            this.geometryType = 'Polygon'
            this.pointDisabled = true
            this.polylineDisabled = true
          }
        }
      }
    },
    saveFeatures() {
      const wkt_c = new WKT()
      const features = this.map
        .getLayerById('drawLayer')
        .getSource()
        .getFeatures()
      if (features.length > 0) {
        let geometryArray = []
        features.forEach(e => {
          if (e.getGeometry().getType() === 'GeometryCollection') {
            geometryArray = e.getGeometry().getGeometries()
          } else {
            geometryArray.push(e.getGeometry())
          }
        })
        const featureCollection = new GeometryCollection(geometryArray)
        const projectFeature = new Feature({
          geometry: featureCollection,
          name: 'projectFeature'
        })
        // let wktstring = wkt_c.writeFeatures(this.map.getLayerById("drawLayer").getSource().getFeatures());
        const wktstring = wkt_c.writeFeature(projectFeature)
        Bus.$emit('tranformFeatures', wktstring)
      } else {
        Bus.$emit('tranformFeatures', '')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import url('../../assets/icon/iconfont.css');
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
#navigation {
  position: absolute;
  top: 150px;
  left: 0;
  z-index: 999;
}
.el-tooltip__popper {
  display: none;
}
.el-menu-item {
  &:hover {
    // you can use $subMenuHover
    background-color: lightblue !important;
  }
}
</style>
