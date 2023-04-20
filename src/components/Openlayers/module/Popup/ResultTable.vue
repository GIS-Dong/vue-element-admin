<template>
  <div id="AnalysisList">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span style="float:left;">分析</span>
        <el-button style="float: right;" icon="el-icon-close" circle size="small" @click="closeWindow" />
      </div>
      <div>
        <div id="checkboxDiv">
          <el-checkbox-group v-model="checkList">
            <div v-for="item in analtsisList" :key="item.label" class="el-check-div">
              <el-checkbox :key="item.label" border :label="item.label" />
            </div>
          </el-checkbox-group>
        </div>
        <el-button-group style="padding-top:5px;">
          <el-button type="primary" icon="el-icon-plus" size="small" @click="initDraw">绘制</el-button>
          <el-button type="info" icon="el-icon-delete" size="small" @click="clear">清除</el-button>
          <el-button type="success" icon="el-icon-check" size="small" @click="beginAnalysis">分析</el-button>
          <el-button type="danger" icon="el-icon-delete" size="small" @click="showAnalysisResult">结果</el-button>
        </el-button-group>
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
// import Bus from '../../Public/util/bus.js';
// import { getConfigJSON } from '../../Public/util/common.js';
import Polygon from 'ol/geom/Polygon'
import MultiPolygon from 'ol/geom/MultiPolygon'

export default {
  props: ['shinemap'],
  data() {
    return {
      analtsisList: undefined,
      checkList: []
    }
  },
  mounted() {
    // getConfigJSON()
    // .then(response => {
    //     this.analtsisList = response.analyze;
    // })
  },
  methods: {
    closeWindow() {
      $('#AnalysisList').hide()
      Bus.$emit('setActiveIndex')
    },
    beginAnalysis() {
      if (this.checkList.length == 0) {
        return this.$message({
          message: '未选择分析项',
          type: 'warning'
        })
      } else {
        const analysisCheckedList = []
        this.analtsisList.forEach(element => {
          this.checkList.forEach(check => {
            if (element.label == check) {
              analysisCheckedList.push(element)
            }
          })
        })
        const selstcFeatures = this.shinemap.map.getSelectFeatures().getArray()
        if (selstcFeatures.length == 0) {
          return this.$message({
            message: '未选择分析地块',
            type: 'warning'
          })
        }
        // 检查是否存在非面要素
        for (let i = 0, l = selstcFeatures.length; i < l; i++) {
          if (
            selstcFeatures[i].getGeometry() instanceof MultiPolygon ||
            selstcFeatures[i].getGeometry() instanceof Polygon
          ) {
            continue
          } else {
            return this.$message.error('分析地块中存在非面要素')
          }
        }
        // this.$store.commit('setAnalysisList', analysisCheckedList);
        Bus.$emit('beginAnalysis', analysisCheckedList)
      }
    },
    showAnalysisResult() {
      Bus.$emit('openAnalysisResult')
    },
    clear() {
      this.shinemap.map
        .getLayerById('drawLayer')
        .getSource()
        .clear()
    },
    initDraw() {
      this.shinemap.interactionManager.openInteraction('mapDraw')
    }
  }
}
</script>

<style>
#AnalysisList {
  width: 320px;
  position: absolute;
  top: 2.2em;
  right: 3em;
  z-index: 999;
  /* display: none; */
}
#AnalysisList .el-checkbox.is-bordered + .el-checkbox.is-bordered {
  margin-left: 0;
}
#AnalysisList .el-check-div {
  padding-top: 5px;
  min-width: 280px;
  display: flex;
}
#AnalysisList .el-button--small,
.el-button--small.is-round {
  padding: 9px 12px;
}
#AnalysisList .el-card__body {
  padding: 0 10px 10px 10px;
}
#AnalysisList #checkboxDiv {
  max-height: 200px;
  overflow: auto;
}
</style>
