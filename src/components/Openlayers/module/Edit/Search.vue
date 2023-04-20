<template>
  <div id="search">
    <IdentifyPopup :map="map" />
    <div class="selectlist" style="width: 115px;">
      <span>
        <el-select v-model="value" @change="selectChange()">
          <el-option v-for="(item, index) in XZQList" :key="index" :value="item.value" :label="item.name" />
        </el-select>
      </span>
    </div>

    <div class="searchInfo" style="width: 230px;">
      <!-- @focus='findKey' -->
      <el-input
        v-model="keyword"
        placeholder="请输入关键信息"
        class="input-with-select"
        clearable
        @keyup.enter.native="findKey"
      >
        <el-button slot="append" class="icon_search" icon="el-icon-search" @click="findKey" />
      </el-input>
      <div v-if="listData.length > 0" class="list">
        <div class="resultInfo" @mouseenter="showList">共找到{{ resultInfo }}个搜索结果</div>
        <section
          v-for="(item, i) in listData"
          :key="i"
          class="listData"
          @mouseenter="selectStyle(i + 1)"
          @mouseleave="outStyle(i + 1)"
        >
          <div style="cursor:pointer;" class="activeTit" @click="locate(item.lonlat)">
            <span class="num">{{ i + 1 }}</span>
            <span>名称：</span>
            <span>{{ item.name }}</span>
          </div>
          <div>
            <span>地址：</span>
            <span>{{ item.address }}</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<script>
import $ from 'jquery'
// import WKT from 'ol/format/WKT'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point.js'
import Overlay from 'ol/Overlay'
// eslint-disable-next-line no-unused-vars
import { Circle, Fill, Stroke, Style, Icon, Text } from 'ol/style.js'
import vm from '@/ShineMap/util/bus'
import IdentifyPopup from './searchResultPopup.vue' // 地图弹出框
import xzqCode from '@/ShineMap/mapConfig/XZQCode.json'
import RegionNavigation from '@/ShineMap/module/Location/RegionNavigation'
export default {
  components: {
    IdentifyPopup
  },
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
      url: 'http://api.tianditu.gov.cn/search',
      keyword: '',
      activeId: null,
      listData: [],
      resultInfo: '',
      regionCode: undefined,
      XZQList: [
        // { name: '桐村镇', value: '330824106' },
        // { name: '杨林镇', value: '330824107' },
        // { name: '苏庄镇', value: '330824108' },
        // { name: '齐溪镇', value: '330824109' },
        // { name: '村头镇', value: '330824113' },
        // { name: '华埠镇', value: '330824115' },
        // { name: '马金镇', value: '330824116' },
        // { name: '池淮镇', value: '330824117' },
        // { name: '中村乡', value: '330824202' },
        // { name: '长虹乡', value: '330824205' },
        // { name: '何田乡', value: '330824208' },
        // { name: '林山乡', value: '330824216' },
        // { name: '音坑乡', value: '330824217' },
        // { name: '大溪边乡', value: '330824218' }
      ],
      value: '',
      loadingInstance: undefined
    }
  },
  mounted() {
    this.initXZQ()
    vm.$on('showSearchBar', showSearchBar => {
      if (showSearchBar.showSearchBar) {
        $('#search').show()
      } else {
        $('#search').hide()
      }
    })
    vm.$on('regionCode2Search', regionCode => {
      this.value = regionCode
    })
    setTimeout(() => {
      this.map.on('click', evt => {
        // 因为feature的定位点在图标下顶点，所有查询时，向下调整查询点，方便点击图标查询
        const pixelPoint = this.map.getPixelFromCoordinate(evt.coordinate)
        // const queryPoint = this.map.getCoordinateFromPixel([pixelPoint[0], pixelPoint[1] + 16]);
        const Features = this.map.getFeaturesAtPixel([pixelPoint[0], pixelPoint[1] + 16], {
          layerFilter: layer => {
            // eslint-disable-next-line eqeqeq
            if (layer.get('id') == 'searchResultLayer') {
              return true
            } else {
              return false
            }
          },
          hitTolerance: 10
        })

        if (!!Features && Features.length > 0) {
          this.showPopup(evt.coordinate, Features[0])
        } else {
          // 未查询到任何信息
          this.showPopup(undefined)
        }
      })
    }, 1000)
  },
  beforeDestroy() {
    vm.$off('showIdentifyInfo')
  },
  methods: {
    initXZQ() {
      this.XZQList = []
      xzqCode.xzqCodes.forEach(ele => {
        const tempvalue = {
          name: ele.Name,
          value: ele.ID
        }
        this.XZQList.push(tempvalue)
      })
      const option = this.XZQList.find(item => item.value == this.regionCode)
      if (option) {
        this.value = this.regionCode
      }
    },
    selectChange() {
      const regionNavigation = new RegionNavigation(this.map)
      regionNavigation.locate(this.value)
    },
    // 查询
    findKey() {
      this.getCompany()
    },
    getCompany() {
      const mapExtent = this.map
        .getView()
        .calculateExtent(this.map.getSize())
        .join(',')
      let strParams = {}
      strParams = {
        keyWord: this.keyword,
        level: '11',
        mapBound: mapExtent,
        queryType: '2', // 搜索类型（1：普通搜索，2：视野内搜索，3：周边搜索，4：普通建议词搜索，5：公交规划建议词搜索，6：公交规划起止点搜索（只搜索公交站），7： 纯POI搜索（不搜公交线），10：拉框搜索
        count: '50',
        start: '0'
      }
      const params = {
        postStr: JSON.stringify(strParams),
        type: 'query',
        tk: '17d1619c13e4508bc1945bd59de4edf8'
      }
      if (this.keyword) {
        $.ajax({
          url: this.url,
          type: 'GET',
          data: params,
          dataType: 'json',
          success: response => {
            this.map
              .getLayerById('searchResultLayer')
              .getSource()
              .clear()
            if (response.count > 0) {
              this.map.getView().on('change:resolution', this.hideList) // 地图分辨率改变时触发
              this.map.on('moveend', this.hideList) // 地图拖动时触发
              this.resultInfo = response.pois.length
              this.listData = response.pois
              // console.log(response.pois)
              const featureArray = []
              response.pois.forEach((element, index) => {
                const coord = element.lonlat.split(' ')
                const feature = new Feature({
                  type: 'poiMarker',
                  id: index + 1,
                  properties: {
                    name: element.name,
                    address: element.address
                  },
                  geometry: new Point([Number(coord[0]), Number(coord[1])])
                })
                feature.setStyle(
                  new Style({
                    image: new Circle({
                      radius: 10,
                      fill: new Fill({
                        color: '#008000'
                      }),
                      stroke: new Stroke({
                        color: '#008000',
                        width: 2
                      })
                    }),
                    text: new Text({
                      text: (index + 1).toString(),
                      fill: new Fill({
                        color: '#fff'
                      })
                    })
                  })
                )
                featureArray.push(feature)
              })
              this.map
                .getLayerById('searchResultLayer')
                .getSource()
                .addFeatures(featureArray)
            } else {
              this.map
                .getLayerById('searchResultLayer')
                .getSource()
                .clear()
              this.listData = []
              this.$message('暂无搜索结果')
            }
          }
        })
      } else {
        this.map
          .getLayerById('searchResultLayer')
          .getSource()
          .clear()
        this.listData = []
        this.$message('请输入关键字')
      }
    },
    locate(lonlat) {
      // eslint-disable-next-line eqeqeq
      if (lonlat.split(' ').length == 2) {
        this.map.getView().animate({
          center: [lonlat.split(' ')[0], lonlat.split(' ')[1]],
          zoom: 18,
          duration: 1000
        })
      } else {
        alert('没有坐标位置')
      }
    },
    selectStyle(item) {
      const features = this.map
        .getLayerById('searchResultLayer')
        .getSource()
        .getFeatures()
      features.forEach(element => {
        // eslint-disable-next-line eqeqeq
        if (element.get('id') == item) {
          element.setStyle(
            new Style({
              image: new Circle({
                radius: 10,
                fill: new Fill({
                  color: '#409eff'
                }),
                stroke: new Stroke({
                  color: '#409eff',
                  width: 2
                })
              }),
              text: new Text({
                text: item.toString(),
                fill: new Fill({
                  color: '#fff'
                })
              })
            })
          )
        }
      })
    },
    outStyle() {
      const features = this.map
        .getLayerById('searchResultLayer')
        .getSource()
        .getFeatures()
      features.forEach(element => {
        element.setStyle(
          new Style({
            image: new Circle({
              radius: 10,
              fill: new Fill({
                color: '#008000'
              }),
              stroke: new Stroke({
                color: '#008000',
                width: 2
              })
            }),
            text: new Text({
              text: element.get('id').toString(),
              fill: new Fill({
                color: '#fff'
              })
            })
          })
        )
      })
    },
    showList() {
      $('.listData').show()
      $('.resultInfo').hide()
    },
    hideList() {
      $('.listData').hide()
      $('.resultInfo').show()
    },
    /**
     * 天地图接口需要6位行政区划代码，不够则补0
     * @param {*} regionCode 行政区划代码
     */
    regionCodeFill(regionCode) {
      while (regionCode.length < 6) {
        regionCode += '0'
      }
      return regionCode
    },
    showPopup(position, feature) {
      if (feature) {
        const container = document.getElementById('searchResultPopup')
        // let popupWidth=window.getComputedStyle(container).getPropertyValue('width').split('px')[0]
        // let popupHeigth=window.getComputedStyle(container).getPropertyValue('height').split('px')[0]
        // 弹出属性框
        $('#searchResultPopup').show()
        vm.$emit('showIdentifyInfo', feature.get('properties'))
        if (this.overlayTip instanceof Overlay) {
          this.overlayTip.setPosition(position)
        } else {
          this.overlayTip = new Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: {
              duration: 250
            }
          })
          this.map.addOverlay(this.overlayTip)
          this.overlayTip.setPosition(position)
        }
      } else {
        if (this.overlayTip instanceof Overlay) {
          this.overlayTip.setPosition(undefined)
        }
      }
    }
  }
}
</script>
<style scoped>
#search {
  position: absolute;
  z-index: 9999;
  top: 1%;
  right: 50px;
  display: flex;
}
.el-dropdown {
  margin-left: 5px;
}
.list {
  margin-top: 5px;
  background-color: rgb(255, 255, 255);
  /* height: 300px; */
  min-height: 5px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  border: lightslategray 1px solid;
}
.list::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 10px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}
.list::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  background-color: #409eff;
  background-image: -webkit-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
}
.list::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  /*border-radius: 10px;*/
  background: #ededed;
}
.list > section {
  /* width: $width;  */
  padding: 5px 10px;
  margin: 5px auto;
  text-align: left;
  margin-bottom: 10px;
  box-sizing: border-box;
  border: solid 1px #d1d1d1;
  header {
    display: flex;
    align-items: center;
    margin: 10px 0;
    img {
      width: 10px;
      height: 14px;
      margin-right: 9px;
    }
    p {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
      padding: 0;
    }
  }
  div {
    margin: 5px 0 5px 19px;
  }
  span {
    font-size: 10px;
  }
  a {
    font-size: 13px;
    color: #409eff;
    cursor: pointer;
  }
}
.list > section:hover {
  border: solid 1px #409eff;
}
.num {
  font-size: 20px;
  color: #409eff;
}
.icon_search {
  /* background-color: #409eff; */
  /* color: #409eff; */
}
</style>
