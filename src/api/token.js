import request from '@/utils/request'

export function submitMetadata(data) {
  return request({
    url: '/api/token/submitMetadata',
    method: 'post',
    data
  })
}
