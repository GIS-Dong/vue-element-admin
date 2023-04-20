<template>
  <div id="searchResultPopup" class="ol-popup">
    <el-card class="box-card">
      <!-- <div slot="header" class="clearfix">
        <span>{{totalData.name}}</span>
        <el-button
          style="float: right;"
          icon="el-icon-close"
          circle
          size="small"
          @click="closeWindow"
        ></el-button>
      </div> -->
      <div class="infoMsg">
        <span class="comMsg">名称</span>
        &nbsp;:&nbsp;{{ totalData.name }}
        <br>
        <span class="comMsg">地址</span>
        &nbsp;:&nbsp;{{ totalData.address }}
        <br>
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
import vm from '@/ShineMap/util/bus'
import Feature from 'ol/Feature'

export default {
  props: {
    map: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      layerlabel: '',
      totalData: [],
      tableData: [],
      totalPage: 0,
      currentPage: 0,
      curFeature: undefined
    }
  },
  watch: {},
  mounted() {
    vm.$on('showIdentifyInfo', result => {
      this.totalData = result
    })
  },
  methods: {
    clearCurFeature() {
      if (
        this.curFeature instanceof Feature &&
        this.map.map
          .getLayerById('drawLayer')
          .getSource()
          .getFeatures().length > 0
      ) {
        this.map.map
          .getLayerById('drawLayer')
          .getSource()
          .removeFeature(this.curFeature)
        this.curFeature = undefined
      }
    },
    closeWindow() {
      this.clearCurFeature()
      $('#identifyPopup').hide()
    }
  }
}
</script>

<style>
#searchResultPopup {
  border: 1px solid lightblue;
  position: absolute;
  width: 200px;
  height: auto;
  z-index: 999;
  display: none;
}
#searchResultPopup .infoMsg {
  margin: 0;
  padding: 2px;
  overflow: auto;
  line-height: 23px;
  text-align: left;
}
#searchResultPopup .comMsg {
  /* font-weight: 800; */
  font-family: '微软雅黑';
  /* width: 64px; */
  display: inline-block;
  text-align: justify;
  text-align-last: justify;
  /* float: left; */
}
#searchResultPopup > .box-card > .el-card__header {
  padding: 8px 20px;
}
#searchResultPopup > .box-card > .el-card__body {
  padding: 8px 5px;
}
</style>
