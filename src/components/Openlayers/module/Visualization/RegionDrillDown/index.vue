<template>
  <el-breadcrumb separator-class="el-icon-arrow-right">
    <el-breadcrumb-item
      v-for="(item, index) in regionDrillDownData"
      :key="index"
      :class="{ last: index == regionDrillDownData.length - 1 }"
      :to="{}"
    >
      <span @click="regionClick(item.regionCode, item.regionName)">{{ item.regionName }}</span>
    </el-breadcrumb-item>
    <el-breadcrumb-item v-show="false">占位</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
import DrillEvent from './DrillEvent'
import MapEvent from 'ol/MapEvent.js'

export default {
  props: {
    shinemap: {
      type: Object,
      default() {
        return {}
      }
    },
    regionDrillDownData: {
      type: Object,
      default: () => []
    }
  },
  methods: {
    regionClick(regionCode, regionName) {
      let index
      for (let i = 0; i < this.regionDrillDownData.length; i++) {
        if (this.regionDrillDownData[i].regionCode === regionCode) {
          index = i
          break
        }
      }
      this.shinemap.addDrillRegion(regionCode, undefined, () => {
        // 发出事件，删除当前点击行政区后面的数据
        this.shinemap.dispatchEvent(new MapEvent('drillclickByPage', this.shinemap, index))
        // 发出下钻事件
        this.shinemap.dispatchEvent(new DrillEvent('drillclick', this.shinemap, regionCode, regionName))
      })
    }
  }
}
</script>

<style scoped>
.last >>> .el-icon-arrow-right {
  display: none;
}
</style>
