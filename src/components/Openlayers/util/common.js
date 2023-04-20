/**
 * 此JS文件存放普通JS公共方法
 */

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
    // eslint-disable-next-line no-undef
    xmlDoc = new ActiveXObject('Microsoft.XMLDOM')
    // 或者：xmlDoc = new ActiveXObject("MSXML2.DOMDocument");
    xmlDoc.async = 'false' // 不启用异步，保证加载文件成功之前不会进行下面操作
    xmlDoc.loadXML(xmlstr)
  }
  return xmlDoc
}

// 获取新的GUID
export function newGuid() {
  var guid = ''
  for (var i = 1; i <= 32; i++) {
    var n = Math.floor(Math.random() * 16.0).toString(16)
    guid += n
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      guid += '-'
    }
  }
  return guid
}

/**
 * hex16进制颜色转rgb(rgba)
 * @param hex 例如:"#23ff45"
 * @param opacity 不透明度
 * @returns {string}
 */
export function hexToRgba(hex, opacity = 1) {
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
