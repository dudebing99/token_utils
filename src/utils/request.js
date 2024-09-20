import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 30000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // config.headers.Authorization = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data
    const errorCode = res.errorCode
    const errorMsg = res.errorMsg

    // if the custom code is not 0, it is judged as an error.
    if (errorCode !== 0) {
      Message({
        message: errorMsg || 'Error',
        type: 'error',
        duration: 3 * 1000
      })

      return Promise.reject(new Error(errorMsg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    if (error.response !== undefined) {
      const errorStatus = error.response.status
      if (errorStatus === 401) {
        // to re-login
        MessageBox.confirm(
          'Login expired, re-login or exit',
          'Exit',
          {
            confirmButtonText: 'Re-login',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        ).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
    }

    return Promise.reject(error)
  }
)

export default service
