<template>
  <div id="identifyPopup" class="ol-popup">
    <el-card class="box-card">
      <!-- <div slot="header" class="clearfix">
        <span>企业信息</span>
        <el-button
          style="float: right;"
          icon="el-icon-close"
          circle
          size="small"
          @click="closeWindow"
        ></el-button>
      </div>-->
      <div class="infoMsg">
        <div id="infoDetail">
          <!-- <span class="comMsg">名称</span>
          &nbsp;:&nbsp;{{tableData.xydm}}
          <br>
          <span class="comMsg">级别</span>
          &nbsp;:&nbsp;
          <span :class="getClassName(tableData.zzjg)">{{tableData.zzjg}}&nbsp;级</span>
          <br>
          <span class="comMsg">地址</span>
          &nbsp;:&nbsp;{{tableData.xzjdmc}}-->
        </div>
        <!-- <br> -->
        <el-button size="small" class="comMsgBtn" @click="btnClick">详情</el-button>
        <!-- <el-pagination
          v-show="false"
          layout="prev, pager, next"
          :page-count="totalPage"
          :current-page="currentPage"
          @current-change="curPageChange"
        ></el-pagination>-->
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
import Bus from '@/ShineMap/util/bus.js'
import Feature from 'ol/Feature'
import { queryStyle } from '@/ShineMap/util/index.js'

export default {
  // eslint-disable-next-line vue/require-prop-types
  props: ['shinemap'],
  data() {
    return {
      xydm: '',
      creditCode: '',
      layerlabel: '',
      totalData: [],
      tableData: [],
      totalPage: 0,
      currentPage: 0,
      curFeature: undefined
    }
  },
  computed: {
    getClassName() {
      return function(value) {
        switch (value) {
          case 'A':
            return 'colorA'
          case 'B':
            return 'colorB'
          case 'C':
            return 'colorC'
          case 'D':
            return 'colorD'
        }
      }
    }
  },
  mounted() {
    Bus.$on('showIdentifyInfo', result => {
      this.creditCode = result.creditCode
      this.xydm = result.xydm
    })
    Bus.$on('setInnerHtml', innerHtml => {
      $('#infoDetail').empty()
      $('#infoDetail').append(innerHtml)
    })
  },
  // watch: {
  //   totalData: function(curVal, oldVal) {
  //     this.clearCurFeature();
  //     if (curVal.length > 0) {
  //       this.layerlabel = curVal[0].layerlabel;
  //       this.tableData = curVal[0].properties;
  //       this.totalPage = curVal.length;
  //       this.currentPage = 1;
  //       this.curFeature = new Feature({
  //         geometry: curVal[0].geometry
  //       });
  //       this.curFeature.setStyle(queryStyle);
  //       this.shinemap.map.getLayerById("drawLayer")
  //         .getSource()
  //         .addFeature(this.curFeature);
  //     } else {
  //       // this.closeWindow();
  //       this.layerlabel = '';
  //       this.tableData = [];
  //       this.totalPage = 0;
  //       this.currentPage = 0;
  //       this.curFeature = undefined
  //     }
  //   }
  // },
  methods: {
    clearCurFeature() {
      if (
        this.curFeature instanceof Feature &&
        this.shinemap.map
          .getLayerById('drawLayer')
          .getSource()
          .getFeatures().length > 0
      ) {
        this.shinemap.map
          .getLayerById('drawLayer')
          .getSource()
          .removeFeature(this.curFeature)
        this.curFeature = undefined
      }
    },
    curPageChange(cur) {
      this.clearCurFeature()
      this.curFeature = new Feature({
        geometry: this.totalData[cur - 1].geometry
      })
      this.curFeature.setStyle(queryStyle)
      this.shinemap.map
        .getLayerById('drawLayer')
        .getSource()
        .addFeature(this.curFeature)
      this.layerlabel = this.totalData[cur - 1].layerlabel
      this.tableData = this.totalData[cur - 1].properties
    },
    closeWindow() {
      this.clearCurFeature()
      $('#identifyPopup').hide()
    },
    btnClick() {
      Bus.$emit('onBtnClick', this.creditCode)
      this.closeWindow()
    }
  }
}
</script>

<style lang="scss" scoped>
#identifyPopup {
  position: absolute;
  width: 250px;
  height: auto;
  z-index: 999;
  display: none;
}
#identifyPopup > .box-card > .el-card__header {
  /* padding: 8px 20px; */
  padding: 5px 20px !important;
  line-height: 30px !important;
  color: #fff;
  background-color: #3385ff;
  border-bottom: none;
}
.clearfix {
  text-align: center;
}
.el-button {
  background-color: #3385ff;
  color: #fff;
  padding: 3px;
  margin-top: 5px;
}
#identifyPopup > .box-card > .el-card__body {
  padding: 8px 5px;
}
#identifyPopup .infoMsg {
  margin: 0;
  padding: 2px;
  overflow: auto;
  line-height: 23px;
  text-align: left;
}
#identifyPopup .comMsg {
  font-weight: 800;
  font-family: '微软雅黑';
  width: 64px;
  display: inline-block;
  text-align: justify;
  text-align-last: justify;
}
#identifyPopup .comMsgBtn {
  float: right;
}
#identifyPopup .colorA {
  color: #7fff00;
}
#identifyPopup .colorB {
  color: #0000ff;
}
#identifyPopup .colorC {
  color: #ff8c00;
}
#identifyPopup .colorD {
  color: #ffff00;
}
</style>
