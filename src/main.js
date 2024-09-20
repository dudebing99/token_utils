import Vue from 'vue'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
// import locale from 'element-ui/lib/locale/lang/en' // lang i18n

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import '@/icons' // icon
import '@/permission' // permission control

// import echarts from 'echarts'
// Vue.prototype.$echarts = echarts

// import china from 'echarts/map/json/china.json'
// echarts.registerMap('china', china)

import Clipboard from 'clipboard'
Vue.prototype.Clipboard = Clipboard

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */
// if (process.env.NODE_ENV === 'production') {
//   const { mockXHR } = require('../mock')
//   mockXHR()
// }

// set ElementUI lang to EN
// Vue.use(ElementUI, { locale })
// 如果想要中文版 element-ui，按如下方式声明
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})

Vue.filter('thousand',
  function(number) {
    var num = (number || 0).toString()
    var result = ''
    while (num.length > 3) {
      result = ', ' + num.slice(-3) + result
      num = num.slice(0, num.length - 3)
    }

    if (num) {
      result = num + result
    }

    return result
  }
)

Vue.filter('dateTimeFormat',
  function(utcDateTime) {
    // return if empty string
    if (!utcDateTime || !utcDateTime.trim().length) {
      return ''
    }

    var date = new Date(utcDateTime)
    var year = date.getFullYear()
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()

    return year + '/' + month + '/' + day + '' + ' ' + hours + ':' + minutes + ':' + seconds + ''
  }
)

Vue.filter('floatFormat',
  function(val) {
    val = Math.round(val * 100) / 100
    var xsd = val.toString().split('.')
    if (xsd.length === 1) {
      val = val.toString() + '.00'
      return val
    }
    if (xsd.length > 1) {
      if (xsd[1].length < 2) {
        val = val.toString() + '0'
      }
      return val
    }
  }
)

Vue.filter('byteFormat',
  function byteToSize(bytes) {
    // console.info('call val:', bytes)
    if (bytes === 0) {
      return '0 B'
    }

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    var i = Math.floor(Math.log(bytes) / Math.log(k))
    var j = Math.floor(Math.log(bytes) / Math.log(1000))

    if (i === j) {
      return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
    } else {
      return (bytes / Math.pow(k, j)).toPrecision(3) + ' ' + sizes[j]
    }
  }
)

Vue.filter('mbFormat',
  function mbToSize(mb) {
    // console.info('call val:', mb)
    if (mb === 0) {
      return '0 MB'
    }

    const k = 1024
    const sizes = ['MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    var i = Math.floor(Math.log(mb) / Math.log(k))
    var j = Math.floor(Math.log(mb) / Math.log(1000))

    if (i === j) {
      return (mb / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
    } else {
      return (mb / Math.pow(k, j)).toPrecision(3) + ' ' + sizes[j]
    }
  }
)

Vue.filter('gbFormat',
  function gbToSize(gb) {
    // console.info('call val:', gb)
    if (gb === 0) {
      return '0 GB'
    }

    const k = 1024
    const sizes = ['GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    var i = Math.floor(Math.log(gb) / Math.log(k))
    var j = Math.floor(Math.log(gb) / Math.log(1000))

    if (i === j) {
      return (gb / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
    } else {
      return (gb / Math.pow(k, j)).toPrecision(3) + ' ' + sizes[j]
    }
  }
)

import './assets/common.less'

Vue.config.productionTip = false
