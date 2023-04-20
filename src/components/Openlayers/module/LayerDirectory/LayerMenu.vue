<template>
  <div id="LayerMenu">
    <el-card v-cardDrag class="box-card">
      <div slot="header" class="clearfix">
        <el-button style="float: left;" icon="el-icon-close" circle size="small" @click="closeWindow" />
        <span>图层列表</span>
        <el-button
          style="float: right;"
          icon="el-icon-edit"
          circle
          size="small"
          @click="showLayerController"
        />
      </div>
      <div style="overflow:auto;max-height:400px;">
        <el-input v-model="filterText" placeholder="搜索图层..." size="small" prefix-icon="el-icon-search" />
        <el-tree
          ref="tree"
          :data="treeData"
          show-checkbox
          node-key="id"
          :default-expanded-keys="[1]"
          :default-checked-keys="defaultCheck"
          :props="defaultProps"
          :render-after-expand="false"
          :filter-node-method="filterNode"
          @check-change="treeNodeCheckChange"
        >
          <span slot-scope="{ node, data }" class="custom-tree-node">
            <span v-if="!!data.group && data.group == '1'"><i class="el-icon-tickets" /></span>
            <span v-if="!!data.group && data.group == '2' && !data.layerTable"><i class="el-icon-document" /></span>
            <span
              v-if="!!data.group && data.group == '2' && !!data.layerTable"
            ><i class="el-icon-edit-outline" /></span>
            <span>{{ node.label }}</span>
            <span
              v-if="!!data.group"
              style="display:block;position:absolute;right:0px"
            ><i class="el-icon-share" @click="mapLink(data)" /></span>
          </span>
        </el-tree>
      </div>
    </el-card>
  </div>
</template>

<script>
import $ from 'jquery'
import Bus from '@/ShineMap/util/bus.js'
import axios from 'axios'

export default {
  props: ['shinemap'],
  data() {
    return {
      treeData: [],
      layerData: {},
      filterText: '',
      layerData: [],
      defaultCheck: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      layerParames: undefined
    }
  },
  computed: {
    config() {
      return this.shinemap.configManager ? this.shinemap.configManager.config.toc : undefined
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val)
    }
  },
  watch: {
    config(curVal, oldVal) {
      if (curVal) {
        this.treeData = this.treeDataTransform(curVal)
        window.$layerTreeData = this.treeData
      }
    }
  },
  mounted: function() {
    /**
     * 通过树添加图层
     * @param {String} key 图层id
     * @param {Boolean} checked 是否选中
     * @param {Function} callback 回调函数
     * @param {Object}  parames 其他参数
     */
    Bus.$on('setLayerChecked', (key, checked, callback, parames) => {
      this.layerParames = {
        id: key,
        checked: checked,
        callback: callback,
        parames: parames
      }
      this.$refs.tree.setChecked(key, checked)
    })
  },
  methods: {
    treeDataTransform(data) {
      const folderInfos = []
      const newData = []
      const treeData = []
      // 通过父节点追溯，剔除空目录节点
      data.forEach(item => {
        if (item.type) {
          newData.push(item)
          const parentresult = this.getParentNode(data, item)
          this.parentSearch(data, newData, folderInfos, parentresult)
        }
      })
      // 有效目录节点去重
      this.uniqueArray(newData)
      // 排序
      newData.sort(this.getSortFun('asc', 'showIndex'))
      // 获取目录重复计数(计算该目录节点下有多少图层)
      const folderCount = this.folderCountFunc(folderInfos)
      // 替换treeData里该目录的label
      this.replaceParentLabel(newData, folderCount)
      // 把所有的第一级父节点找到，并添加children节点
      for (let i = 0; i < newData.length; i++) {
        // 初始选中
        if (newData[i].url && newData[i].url !== '' && newData[i].initChecked) {
          this.defaultCheck.push(newData[i].id)
          this.shinemap._addCheckedLayers(newData[i])
        }
        if (newData[i].id == 'P6F2D955F5A84BA882CC7B645974376C') {
          newData.splice(i, 1)
          i--
        } else if (newData[i].parent == 'P6F2D955F5A84BA882CC7B645974376C') {
          const obj = newData[i]
          obj.children = []
          treeData.push(obj)
          newData.splice(i, 1)
          i--
        }
      }
      // 将所有数据放在其父节点的children节点下
      this.dataTransform(newData, treeData)
      // 转换完的数据
      return treeData
    },
    // 树节点过滤
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    // Tree的主动选择
    treeNodeCheckChange(item, isChecked) {
      if (item.url && item.url !== '') {
        if (isChecked) {
          // 判断该图层是否有回调函数或其他参数
          if (this.layerParames && this.layerParames.id == item.id && this.layerParames.checked == isChecked) {
            item.callback = this.layerParames.callback
            item.layerParames = this.layerParames.parames
            this.layerParames = undefined
          }
          this.shinemap._addCheckedLayers(item)
          setTimeout(() => {
            item.callback = undefined
            item.layerParames = undefined
          }, 100)
        } else {
          // 判断该图层是否有回调函数或其他参数
          if (this.layerParames && this.layerParames.id == item.id && this.layerParames.checked == isChecked) {
            item.callback = this.layerParames.callback
            item.layerParames = this.layerParames.parames
            this.layerParames = undefined
          }
          this.shinemap._removeCheckedLayers(item)
          setTimeout(() => {
            item.callback = undefined
            item.layerParames = undefined
          }, 100)
        }
      }
    },
    /**
     * 获取父节点
     * @param layerInfo 节点信息
     * @method getParentNode
     */
    getParentNode(data, layerInfo) {
      const parentresult = $(data).filter((index, item) => {
        return item.id == layerInfo.parent && !item.type
      })
      return parentresult
    },
    /**
     * 追溯父节点
     * @param parentresult 节点信息
     * @method parentSearch
     */
    parentSearch(data, newData, folderInfos, parentresult) {
      if (parentresult.length > 0) {
        if (parentresult[0].id == 'P6F2D955F5A84BA882CC7B645974376C') {
          return
        }
        newData.push(parentresult[0])
        folderInfos.push(parentresult[0])
        parentresult = this.getParentNode(data, parentresult[0])
        this.parentSearch(data, newData, folderInfos, parentresult)
      }
    },
    // 目录节点计数
    folderCountFunc(folderInfos) {
      const arr = []
      const info = {}
      folderInfos.forEach(folderInfo => {
        if (info[folderInfo.id]) {
          info[folderInfo.id]++
        } else {
          info[folderInfo.id] = 1
        }
      })
      for (const item in info) {
        arr.push({
          id: item,
          count: info[item]
        })
      }
      return arr
    },
    // 替换目录节点的标签，添加目录计数
    replaceParentLabel(newData, countArray) {
      countArray.forEach(countInfo => {
        newData.forEach(tocInfo => {
          if (tocInfo.id == countInfo.id) {
            tocInfo.label = tocInfo.label + '(' + countInfo.count + ')'
          }
        })
      })
    },
    // 数组去重
    uniqueArray(newData) {
      const tmp = {}
      let j = 0
      const a = newData.slice()
      for (let i = 0; i < a.length; i++) {
        if (!tmp[a[i].id]) {
          tmp[a[i].id] = !0
          j++
        } else {
          newData.splice(j, 1)
        }
      }
    },
    getSortFun(order, sortBy) {
      const ordAlpah = order == 'asc' ? '>' : '<'
      const sortFun = new Function('a', 'b', 'return a.' + sortBy + ordAlpah + 'b.' + sortBy + '?1:-1')
      return sortFun
    },
    dataTransform(newData, arr) {
      if (newData.length > 0 && arr.length > 0) {
        for (let i = 0, l = arr.length; i < l; i++) {
          for (let j = 0; j < newData.length; j++) {
            if (newData[j].parent == arr[i].id) {
              const obj = newData[j]
              obj.children = []
              arr[i].children.push(obj)
              newData.splice(j, 1)
              j--
            }
          }
          this.dataTransform(newData, arr[i].children)
        }
      }
    },
    closeWindow() {
      $('#LayerMenu').hide()
    },
    showLayerController() {
      $('#LayerController').show()
      $('#LayerMenu').hide()
    },
    mapLink(data) {
      this.shinemap.addLinkMap(data)
    }
  }
}
</script>

<style scoped>
#LayerMenu .custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 14px;
  padding-right: 20px;
}
#LayerMenu {
  position: absolute;
  min-width: 240px;
  max-width: 400px;
  max-height: 100px;
  top: 50px;
  left: 12%;
  z-index: 999;
  /* display: none; */
}
#LayerMenu .el-card__body {
  padding: 10px 15px 15px 15px;
}
#LayerMenu > .box-card > .el-card__header {
  padding: 8px 20px;
}
</style>
