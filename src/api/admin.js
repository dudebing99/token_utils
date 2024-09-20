import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/unauthorized/admin/login_with_captcha',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/api/admin/logout',
    method: 'post'
  })
}

export function adminPassword(data) {
  return request({
    url: '/api/admin/password',
    method: 'post',
    data
  })
}
