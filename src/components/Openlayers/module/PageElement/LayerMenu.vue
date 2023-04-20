<template>
  <div>
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
        <span>{{ node.label }}</span>
        <span v-if="!!data.url" class="layerMenuIconGroup">
          <i class="el-icon-location-outline" />
        </span>
      </span>
    </el-tree>
  </div>
</template>

<script>
export default {
  props: ['map'],
  data() {
    return {
      treeData: [],
      filterText: '',
      defaultCheck: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val)
    },
    map(newValue) {
      if (newValue) {
        this.initTree()
      }
    }
  },
  methods: {
    /**
     * 初始化树组件的数据
     */
    initTree() {
      this.treeData = this.map.configManager.getlayersConfig()
      this.defaultCheck = this.map.configManager.getInitCheckedLayers()
    },
    // Tree的主动选择
    treeNodeCheckChange(item, isChecked) {
      if (item.url && item.url !== '') {
        if (isChecked) {
          this.map.addTargetLayer(item)
        } else {
          this.map.removeTargetLayer(item)
        }
      }
    },
    // 树节点过滤
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    }
  }
}
</script>

<style scoped>
.custom-tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}
.layerMenuIconGroup {
  min-width: 50px;
  text-align: right;
  display: block;
}
</style>
