import axios from 'axios'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js'

/**
 * 读取xml字符串，返回XML
 * @param {String} xmlstr
 */
export function LoadXmlText(xmlstr) {
  let xmlDoc
  if (window.DOMParser) {
    // 非IE浏览器
    xmlDoc = new DOMParser().parseFromString(xmlstr, 'text/xml')
  } else {
    // IE浏览器
    xmlDoc = new ActiveXObject('Microsoft.XMLDOM')
    // 或者：xmlDoc = new ActiveXObject("MSXML2.DOMDocument");
    xmlDoc.async = 'false' // 不启用异步，保证加载文件成功之前不会进行下面操作
    xmlDoc.loadXML(xmlstr)
  }
  return xmlDoc
}

const SelectFill = new Fill({
  color: 'rgba(0,255,0,0.4)'
})
const selectStroke = new Stroke({
  color: '#00FF00',
  width: 1.25
})
/**
 * 选择样式
 */
export const selectStyles = [
  new Style({
    image: new CircleStyle({
      fill: SelectFill,
      stroke: selectStroke,
      radius: 7
    }),
    fill: SelectFill,
    stroke: selectStroke
  })
]

/**
 * 查询功能中，查询到的geometry的展示样式
 */
const queryFill = new Fill({
  color: [0, 0, 0, 0]
})
const queryStroke = new Stroke({
  color: [0, 0, 0, 0],
  width: 3
})
export const queryStyle = new Style({
  fill: queryFill,
  stroke: queryStroke,
  image: new CircleStyle({
    fill: new Fill({
      color: [0, 0, 0, 0]
    }),
    radius: 1
  })
})

const CSCS2000ProjCodes = [
  4490,
  4543,
  4544,
  4545,
  4546,
  4547,
  4548,
  4549,
  4550,
  4551,
  4552,
  4553,
  4554,
  4534,
  4535,
  4536,
  4537,
  4538,
  4539,
  4540,
  4541,
  4542,
  4513,
  4514,
  4515,
  4516,
  4517,
  4518,
  4519,
  4520,
  4521,
  4522,
  4523,
  4524,
  4525,
  4526,
  4527,
  4528,
  4529,
  4530,
  4531,
  4532,
  4533,
  4507,
  4508,
  4509,
  4510,
  4511,
  4512,
  4502,
  4503,
  4504,
  4505,
  4506,
  4491,
  4492,
  4493,
  4494,
  4495,
  4496,
  4497,
  4498,
  4499,
  4500,
  4501
]
const XiAn80ProjCodes = [
  4610,
  2379,
  2380,
  2381,
  2382,
  2383,
  2384,
  2385,
  2386,
  2387,
  2388,
  2389,
  2390,
  2370,
  2371,
  2372,
  2373,
  2374,
  2375,
  2376,
  2377,
  2378,
  2349,
  2350,
  2351,
  2352,
  2353,
  2354,
  2355,
  2356,
  2357,
  2358,
  2359,
  2360,
  2361,
  2362,
  2363,
  2364,
  2365,
  2366,
  2367,
  2368,
  2369,
  2343,
  2344,
  2345,
  2346,
  2347,
  2348,
  2338,
  2339,
  2340,
  2341,
  2342,
  2327,
  2328,
  2329,
  2330,
  2331,
  2332,
  2333,
  2334,
  2335,
  2336,
  2337
]

/**
 * 根据作坐标系wkid获取名称
 * @param {*} wkid EPSG
 */
export function getProjectionName(wkid) {
  if (wkid === 4326 || wkid === 3857 || wkid === 102100 || wkid === 102113 || wkid === 900913) {
    return 'WGS84'
  } else if (CSCS2000ProjCodes.indexOf(Number(wkid)) > -1) {
    return 'CGCS2000'
  } else if (XiAn80ProjCodes.indexOf(Number(wkid)) > -1) {
    return 'xian80'
  } else {
    return 'other'
  }
}

// 异步获取config.json
export function getConfigJSON() {
  return new Promise((resolve, reject) => {
    axios
      .get('static/config/config.json')
      .then(response => {
        resolve(response.data)
      })
      .catch(err => {
        console.log(err)
        reject(err)
      })
  })
}

// 获取新的GUID
export function newGuid() {
  var guid = ''
  for (var i = 1; i <= 32; i++) {
    var n = Math.floor(Math.random() * 16.0).toString(16)
    guid += n
    if (i === 8 || i === 12 || i === 16 || i === 20) guid += '-'
  }
  return guid
}

/**
 * hex16进制颜色转rgb(rgba)
 * @param hex 例如:"#23ff45"
 * @param opacity 不透明度
 * @returns {string}
 */

export function hexToRgba(hex, opacity) {
  return (
    'rgba(' +
    parseInt('0x' + hex.slice(1, 3)) +
    ',' +
    parseInt('0x' + hex.slice(3, 5)) +
    ',' +
    parseInt('0x' + hex.slice(5, 7)) +
    ',' +
    opacity +
    ')'
  )
}
