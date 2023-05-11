<template>
  <div id="xzq_bar" class="map_block">
    <span style="margin:8px;">当前位置:</span>
    <el-select v-model="defaultValue" class="xzq_select" placeholder="请选择" @change="handleChange">
      <el-option v-for="item in xzqList" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-button
      v-show="backVisible"
      style="margin-left: 4px;background: #2560cb;color: white;"
      @click="back"
    >返回</el-button>
  </div>
</template>

<script>
import $ from 'jquery'
import XZQData from '../../../mapConfig/XZQ_ZJ'
import Bus from '../../../util/bus'
import { GeoJSON } from 'ol/format'
import { getCenter } from 'ol/extent'
import Select from 'ol/interaction/Select'
import { pointerMove } from 'ol/events/condition'
import { Fill, Stroke, Style, Text } from 'ol/style'

export default {
  components: {},
  props: {
    map: {
      type: Object,
      default: undefined
    }
  },
  data() {
    return {
      defaultValue: '330000',
      user_xzqdm: '',
      current_xzqdm: '',
      allFeatures: [],
      userLevel: 0,
      xzqList: [
        {
          value: '330000',
          label: '浙江省'
        },
        {
          value: '330100',
          label: '杭州市'
        }
      ],
      backVisible: false
    }
  },
  watch: {
    xzqParams(obj) {
      console.log(obj)
    }
    // allFeatures(newValue) {
    //   if (newValue.length > 0) {
    //     console.log(2222)
    //   }
    // }
  },
  mounted() {
    // this.allFeatures = this.formatData(xzqdata)
    Bus.$on('user_xzqdm', user_xzqdm => {
      console.log(user_xzqdm)
      this.user_xzqdm = user_xzqdm
      // this.switchByCode(this.user_xzqdm)
      this.userLevel = this.getLevel(user_xzqdm)
      if (this.allFeatures.length === 0) {
        this.allFeatures = this.formatData(XZQData)
        this.switchByCode(this.user_xzqdm)

        // $.ajax({
        //   url:
        //     'https://szh.rfb.zj.gov.cn:8180/geoserver/xzq_data/wms?service=WMS&version=1.1.0&request=GetMap&layers=xzq_data:jb_xzq_zj_value&bbox=118.022573565%2C27.1434226850001%2C122.83420269%2C31.18255606&width=768&height=644&srs=EPSG%3A4490&styles=&format=geojson',
        //   type: 'GET',
        //   dataType: 'json',
        //   success: response => {
        //     this.allFeatures = this.formatData(response)
        //     this.switchByCode(this.user_xzqdm)
        //   },
        //   error: error => {
        //     console.error(error)
        //   }
        // })
      } else {
        this.switchByCode(this.user_xzqdm)
      }
    })
    this.initMapControlAndEvent()
  },
  methods: {
    handleChange(e) {
      if (this.userLevel !== this.getLevel(e)) {
        this.backVisible = true
      } else {
        this.backVisible = false
      }
      this.switchByCode(e)
    },
    getLevel(code) {
      if (code.toString().substring(2) === '0000') {
        return 1
      } else if (code.toString().substring(4) === '00') {
        return 2
      } else {
        return 3
      }
    },
    formatData(data) {
      const features = new GeoJSON().readFeatures(data)
      return features
    },
    switchByCode(code) {
      this.map
        .getLayerById('regionNavigation')
        .getSource()
        .clear()
      let featuresResults = []
      this.xzqList = []
      this.allFeatures.forEach(e => {
        if (e.get('pcode').toString() === code) {
          featuresResults.push(e)
          this.xzqList.push({
            value: e.get('code'),
            label: e.get('name')
          })
        } else {
          if (e.get('code').toString() === code) {
            // featuresResults.push(e)
            this.xzqList.push({
              value: e.get('code'),
              label: e.get('name')
            })
          }
        }
      })
      if (featuresResults.length === 0) {
        featuresResults = this.allFeatures.filter(e => {
          return e.get('code').toString() === code
        })
      }
      if (featuresResults.length > 0) {
        this.map
          .getLayerById('regionNavigation')
          .getSource()
          .addFeatures(featuresResults)
        // this.pcode = featuresResults[0].get('pcode')
        const ext = this.map
          .getLayerById('regionNavigation')
          .getSource()
          .getExtent()
        this.map.getView().animate({
          center: getCenter(ext),
          resolution: this.map.getView().getResolutionForExtent(
            this.map
              .getLayerById('regionNavigation')
              .getSource()
              .getExtent(),
            [this.map.getSize()[0] * 0.7, this.map.getSize()[1] * 0.7]
          ),
          duration: 800
        })
      }
      const objArr = this.allFeatures.filter(item => {
        return code === item.get('code').toString()
      })
      this.pcode = objArr[0].get('pcode')
      this.defaultValue = objArr[0].get('code')
      if (this.xzqList.length > 0) {
        this.xzqList.sort((a, b) => {
          return a.value - b.value
        })
        if (code === '330000') {
          const tempArr = [this.xzqList[4], this.xzqList[5]]
          this.xzqList.splice(4, 2, tempArr[1], tempArr[0])
        }
      }
    },
    back() {
      if (this.userLevel === 3 || this.pcode === '100000' || Number(this.pcode) < Number(this.user_xzqdm)) {
        return
      }
      if (this.userLevel !== this.getLevel(this.pcode)) {
        this.backVisible = true
        this.switchByCode(this.pcode)
      } else {
        this.backVisible = false
        this.switchByCode(this.pcode)
      }
      // console.log(this.pcode)
      // if (this.pcode == this.user_xzqdm || this.user_xzqdm.toString().substring(4) != '00') {
      //   return
      // } else {
      //   this.switchByCode(this.pcode)
      // }
    },
    initMapControlAndEvent() {
      this.map.getLayerById('regionNavigation').setStyle(feature => {
        return new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.0)'
          }),
          stroke: new Stroke({
            color: 'rgba(0,197,157, 1)',
            width: 2
          }),
          text: new Text({
            // font: '微软雅黑 18px',
            scale: 1.3,
            text: feature.get('name'),
            color: 'red',
            stroke: new Stroke({
              color: 'rgba(0,197,157, 1)',
              width: 2
            })
          })
        })
      })
      // select选中样式
      const selectPointerMove = new Select({
        condition: pointerMove,
        style: feature => {
          return new Style({
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0.0)'
            }),
            stroke: new Stroke({
              color: 'rgba(255,255,255, 1)',
              width: 4
            }),
            zIndex: 111
          })
        }
      })
      this.map.addInteraction(selectPointerMove)
      const that = this
      // 鼠标移动改变形状
      this.map.on('pointermove', function(evt) {
        that.map.getTargetElement().style.cursor = that.map.hasFeatureAtPixel(evt.pixel, {
          layerFilter: layer => {
            if (layer.get('id') === 'regionNavigation') {
              return true
            } else {
              return false
            }
          }
        })
          ? 'pointer'
          : ''
      })
      // 地图点击查询
      this.map.on('click', evt => {
        // 因为feature的定位点在图标下顶点，所有查询时，向下调整查询点，方便点击图标查询
        const pixelPoint = this.map.getPixelFromCoordinate(evt.coordinate)
        const features = this.map.getFeaturesAtPixel([pixelPoint[0], pixelPoint[1] + 16], {
          layerFilter: layer => {
            if (layer.get('id') === 'regionNavigation') {
              return true
            } else {
              return false
            }
          },
          hitTolerance: 10
        })
        if (!!features && features.length > 0) {
          if (
            this.map
              .getLayerById('regionNavigation')
              .getSource()
              .getFeatures().length > 1
          ) {
            this.switchByCode(features[0].get('code'))
            if (this.userLevel !== this.getLevel(features[0].get('code'))) {
              this.backVisible = true
            } else {
              this.backVisible = false
            }
          }

          // 查询结果
          // this.showPopup(evt.coordinate, features[0])
        } else {
          // 未查询到任何信息
          console.log('未选中')
          this.back()
        }
      })
    }
  }
}
</script>

<style>
#xzq_bar {
  position: absolute;
  z-index: 9999;
  top: 1%;
  right: 50px;
  display: flex;
  padding: 8px;
  background: #8ad0d39e;
  border-radius: 5px;
}
.xzq_select {
  width: 130px;
}
.el-input--small .el-input__inner {
  height: 35px;
  line-height: 32px;
  font-size: 15px;
}
</style>
