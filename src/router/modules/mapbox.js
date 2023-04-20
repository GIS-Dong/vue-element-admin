/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout'

const mapboxRouter = {
  path: '/mapbox',
  component: Layout,
  redirect: 'noRedirect',
  name: 'mapbox',
  meta: {
    title: 'Mapbox-GL',
    icon: 'el-icon-position'
  },
  children: [
    {
      path: 'keyboard',
      component: () => import('@/views/charts/keyboard'),
      name: 'KeyboardChart',
      meta: { title: 'Keyboard Chart', noCache: true }
    },
    {
      path: 'line',
      component: () => import('@/views/charts/line'),
      name: 'LineChart',
      meta: { title: 'Line Chart', noCache: true }
    },
    {
      path: 'mix-chart',
      component: () => import('@/views/charts/mix-chart'),
      name: 'MixChart',
      meta: { title: 'Mix Chart', noCache: true }
    }
  ]
}

export default mapboxRouter
