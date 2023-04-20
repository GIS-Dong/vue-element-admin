function getEchartsOption(seriesData) {
  const geoCoordMap = {
    A类企业: [120.7964, 29.0717],
    B类企业: [120.8997, 29.1246],
    C类企业: [121.0057, 29.1715],
    D类企业: [121.1171, 29.1974]
  }

  const convertData = function(data) {
    data = [data]
    const res = []
    for (let i = 0; i < data.length; i++) {
      const geoCoord = geoCoordMap[data[i].name]
      if (geoCoord) {
        res.push({
          name: data[i].name,
          value: geoCoord.concat(data[i].value)
        })
      }
    }
    return res
  }

  const echartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return params.name + '<br/>' + params.seriesName + ':' + params.value[2]
      }
    },
    series: [
      {
        name: '企业数量',
        type: 'effectScatter',
        data: convertData(seriesData[0]),
        symbolSize: function(val) {
          if (val[2] > 0) {
            return val[2] / 10 < 10 ? 10 : val[2] / 10
          } else {
            return val[2]
          }
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        hoverAnimation: true,
        label: {
          normal: {
            formatter: '{a}',
            position: 'right',
            show: false
          }
        },
        itemStyle: {
          normal: {
            color: '#44F842',
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        zlevel: 1
      },
      {
        name: '企业数量',
        type: 'effectScatter',
        data: convertData(seriesData[1]),
        symbolSize: function(val) {
          if (val[2] > 0) {
            return val[2] / 10 < 10 ? 10 : val[2] / 10
          } else {
            return val[2]
          }
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        hoverAnimation: true,
        label: {
          normal: {
            formatter: '{b}',
            position: 'right',
            show: false
          }
        },
        itemStyle: {
          normal: {
            color: '#328BFC',
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        zlevel: 1
      },
      {
        name: '企业数量',
        type: 'effectScatter',
        data: convertData(seriesData[2]),
        symbolSize: function(val) {
          if (val[2] > 0) {
            return val[2] / 10 < 10 ? 10 : val[2] / 10
          } else {
            return val[2]
          }
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        hoverAnimation: true,
        label: {
          normal: {
            formatter: '{b}',
            position: 'right',
            show: false
          }
        },
        itemStyle: {
          normal: {
            color: '#FABF23',
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        zlevel: 1
      },
      {
        name: '企业数量',
        type: 'effectScatter',
        data: convertData(seriesData[3]),
        symbolSize: function(val) {
          if (val[2] > 0) {
            return val[2] / 12 < 10 ? 10 : val[2] / 12
          } else {
            return val[2]
          }
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        hoverAnimation: true,
        label: {
          normal: {
            formatter: '{b}',
            position: 'right',
            show: false
          }
        },
        itemStyle: {
          normal: {
            color: '#F60000',
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        zlevel: 1
      }
    ]
  }

  return echartsOption
}

export default getEchartsOption
