/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout'

const openlayersRouter = {
  path: '/openlayers',
  component: Layout,
  redirect: 'noRedirect',
  name: 'openlayers',
  meta: {
    title: 'Openlayers',
    icon: 'el-icon-place'
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/openlayers/index'),
      name: 'index',
      meta: { title: '地图初始化', noCache: true }
    },
    {
      path: 'regionSwitch',
      component: () => import('@/views/openlayers/regionSwitch'),
      name: 'regionSwitch',
      meta: { title: '行政区切换', noCache: true }
    }
  ]
}

export default openlayersRouter
