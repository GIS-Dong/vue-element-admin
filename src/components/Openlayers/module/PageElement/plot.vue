<!-- 防空疏散 -->
<template>
  <div style="width:100%;height:100%;">
    <div id="map" />
    <div id="user-tool" class="user-tool">
      <!-- <button class="btn btn-success" data-type="Point">测试画点</button>
      <button class="btn btn-success" data-type="Polyline">测试画线</button>
      <button class="btn btn-success" data-type="Curve">测试画曲线</button>
      <button class="btn btn-success" data-type="Arc">测试画弓形</button>
      <button class="btn btn-success" data-type="Circle">测试画圆</button>

      <button class="btn btn-success" data-type="FreeLine">测试画自由线</button>
      <button class="btn btn-success" data-type="RectAngle">测试画矩形</button>
      <button class="btn btn-success" data-type="Ellipse">测试椭圆</button>
      <button class="btn btn-success" data-type="Lune">测试弓形</button>
      <button class="btn btn-success" data-type="Sector">测试画扇形</button>
      <button class="btn btn-success" data-type="ClosedCurve">测试画闭合曲面</button>
      <button class="btn btn-success" data-type="Polygon">测试多边形</button>
      <button class="btn btn-success" data-type="FreePolygon">测试自由面</button>
      <button class="btn btn-success" data-type="AssaultDirection">测试集结地</button>

      <button class="btn btn-success" data-type="DoubleArrow">测试双箭头</button>
      <button class="btn btn-success" data-type="StraightArrow">测试细直箭头</button>
      <button class="btn btn-success" data-type="FineArrow">测试粗单尖头箭头</button>
      <button class="btn btn-success" data-type="AttackArrow">测试进攻方向</button>
      <button class="btn btn-success" data-type="AssaultDirection">测试粗单直箭头</button>
      <button class="btn btn-success" data-type="TailedAttackArrow">测试进攻方向（尾）</button>
      <button class="btn btn-success" data-type="SquadCombat">测试分队战斗行动</button>
      <button class="btn btn-success" data-type="TailedSquadCombat">测试分队战斗行动（尾）</button> -->

      <button class="btn btn-success" data-type="Point">画点</button>
      <button class="btn btn-success" data-type="Polyline">画线</button>
      <button class="btn btn-success" data-type="Circle">画圆</button>

      <button class="btn btn-success" data-type="RectAngle">画矩形</button>
      <button class="btn btn-success" data-type="Ellipse">椭圆</button>
      <button class="btn btn-success" data-type="Lune">弓形</button>
      <button class="btn btn-success" data-type="Sector">画扇形</button>
      <button class="btn btn-success" data-type="ClosedCurve">画闭合曲面</button>
      <button class="btn btn-success" data-type="Polygon">多边形</button>
      <button class="btn btn-success" data-type="FreePolygon">自由面</button>
      <br>
      <button class="btn btn-success" data-type="DoubleArrow">双箭头</button>
      <button class="btn btn-success" data-type="StraightArrow">细直箭头</button>
      <button class="btn btn-success" data-type="FineArrow">粗单尖头箭头</button>
      <button class="btn btn-success" data-type="AttackArrow">进攻方向</button>
      <button class="btn btn-success" data-type="AssaultDirection">粗单直箭头</button>
      <button class="btn btn-success" data-type="TailedAttackArrow">进攻方向（尾）</button>
      <button class="btn btn-success" data-type="SquadCombat">分队战斗行动</button>
      <button class="btn btn-success" data-type="TailedSquadCombat">分队战斗行动（尾）</button>
      <button class="btn btn-success" data-type="clear">清空</button>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile } from 'ol/layer'
import { XYZ } from 'ol/source'
import OlPlot from 'ol-plot'
import Bus from '../../util/bus'
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
      plot: undefined
    }
  },

  computed: {},
  watch: {},
  mounted() {
    const that = this
    var tools = document.getElementById('user-tool')
    tools.onclick = function(ev) {
      ev = ev || window.event
      var target = ev.target || ev.srcElement
      if (target.nodeName.toLowerCase() === 'button') {
        var type = target.getAttribute('data-type')
        if (type === 'clear') {
          that.plot.plotDraw.drawLayer.getSource().clear()
        } else {
          that.activate(type)
        }
        console.log(type)
      }
    }
    // this.initMap()
    setTimeout(() => {
      this.initPlotMap()
    }, 500)
    Bus.$on('plotClear', plotShow => {
      that.plot.plotDraw.drawLayer.getSource().clear()
    })
  },
  methods: {
    initMap() {
      // 天地图底图
      var tianMapLayer = new Tile({
        source: new XYZ({
          url: 'http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=17d1619c13e4508bc1945bd59de4edf8',
          wrapX: false
        })
      })

      // 天地图注记
      var tianMapLayer2 = new Tile({
        source: new XYZ({
          url: 'http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=17d1619c13e4508bc1945bd59de4edf8'
        })
      })
      this.map = new Map({
        layers: [
          // new Tile({
          //   source: new OSM()
          // }),
          tianMapLayer,
          tianMapLayer2
        ],
        view: new View({
          center: [120.219375, 30.249244],
          projection: 'EPSG:4326',
          zoom: 12
        }),
        target: 'map'
      })
      this.map.on('click', function(event) {
        console.log(event)
      })
      this.initPlotMap()
    },
    initPlotMap() {
      this.plot = new OlPlot(this.map)
      this.plot.plotDraw.on('drawEnd', this.onDrawEnd)
    },
    // 绘制结束后，添加到FeatureOverlay显示。
    onDrawEnd(event) {
      // event.stopPropagation()//阻止双击事件
      var feature = event.feature
      // 开始编辑
      this.plot.plotEdit.activate(feature)
    },
    // 指定标绘类型，开始绘制。
    activate(type) {
      this.plot.plotEdit.deactivate()
      this.plot.plotDraw.active(type)
    }
  }
}
</script>
<style lang="scss" scoped>
html,
body,
#map {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  font-family: 'Microsoft YaHei';
}
.user-tool {
  // position: absolute;
  // top: 110px;
  // left: calc(57% - (50% - 335px));
  // width: 200px;

  position: absolute;
  top: 10px;
}
.ol-viewport {
  position: inherit !important;
}
.btn {
  display: inline-block;
  padding: 6px 12px;
  margin-bottom: 0;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  -ms-touch-action: manipulation;
  touch-action: manipulation;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  background-image: none;
  border: 1px solid transparent;
  border-radius: 4px;
}
.btn:focus,
.btn:active:focus,
.btn.active:focus,
.btn.focus,
.btn:active.focus,
.btn.active.focus {
  outline: 5px auto -webkit-focus-ring-color;
  outline-offset: -2px;
}
.btn:hover,
.btn:focus,
.btn.focus {
  color: #333;
  text-decoration: none;
}
.btn:active,
.btn.active {
  background-image: none;
  outline: 0;
  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
}
.btn-success {
  color: #fff;
  // background-color: #5cb85c;
  // border-color: #4cae4c;
  background-color: #0e5ca7;
  border-color: #91a991;
}
</style>
