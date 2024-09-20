<template>
  <div class="dashboard-container">
    <el-card class="box-card">
      <div class="upload-entry">
        <el-upload
          class="upload-demo"
          drag
          :action="`${baseURL}/api/token/uploadPic`"
          multiple
          :limit="limit"
          list-type="text"
          :before-upload="beforeUpload"
          :on-exceed="onExceed"
          :on-change="onChange"
          :on-success="onSuccess"
          :on-error="onError"
          :on-progress="onProgress"
          :file-list="fileList"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">drag files here, or<em> click</em></div>
          <div slot="tip" class="el-upload__tip"><em>jpg/jpeg/png only with maximum size 2 MB</em></div>
        </el-upload>
      </div>
      <div v-show="visible">
        <el-divider content-position="center">Total uploaded files: {{ uploadedFileList.length }}</el-divider>
      </div>
      <el-table
        v-show="visible"
        stripe
        :data="uploadedFileList"
        empty-text="no data"
        max-height="800px"
        style="width: 100%; margin-bottom:30px;"
      >
        <el-table-column type="index" label="index" align="center" width="100px" />
        <!-- <el-table-column prop="uid" label="uid" align="center" width="150px" /> -->
        <el-table-column label="name" align="left" width="500px">
          <template slot-scope="scope">
            <div>{{ scope.row.name }}&nbsp;
              <el-button
                id="nameCopyButton"
                size="small"
                icon="el-icon-document-copy"
                type="text"
                data-clipboard-action="copy"
                :data-clipboard-text="scope.row.name"
                @click="onCopyName"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="" align="center" width="200px">
          <template slot-scope="scope">
            <img
              :src="scope.row.response != undefined ? (scope.row.response.data != undefined ? scope.row.response.data : '') : ''"
              alt=""
              width="80px"
              height="60px"
            >
          </template>
        </el-table-column>
        <el-table-column label="size" align="left" width="100px">
          <template slot-scope="scope">
            <div>{{ scope.row.size | byteFormat }}</div>
          </template>
        </el-table-column>
        <el-table-column label="status" align="center" width="100px">
          <template slot-scope="scope">
            <svg-icon v-if="scope.row.status = 'success'" icon-class="success" />
            <svg-icon v-else icon-class="fail" />
          </template>
        </el-table-column>
        <el-table-column label="url" align="center" width="800px">
          <template slot-scope="scope">
            <div>
              <el-link
                type="primary"
                :href="scope.row.response != undefined ? (scope.row.response.data != undefined ? scope.row.response.data : '') : ''"
                target="_blank"
              >{{ scope.row.response != undefined ? (scope.row.response.data != undefined ?
                scope.row.response.data :
                "") : "" }}</el-link>&nbsp;
              <el-button
                id="urlCopyButton"
                :v-show="scope.row.response != undefined && scope.row.response.data != undefined"
                size="small"
                icon="el-icon-document-copy"
                type="text"
                data-clipboard-action="copy"
                :data-clipboard-text="(scope.row.response != undefined && scope.row.response.data != undefined) ? scope.row.response.data : ''"
                @click="onCopyUrl"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>

export default {
  data() {
    return {
      baseURL: process.env.VUE_APP_BASE_API,
      limit: 1000,
      fileList: [],
      uploadedFileList: [],
      visible: false
    }
  },
  methods: {
    beforeUpload(file) {
      const validImgs = ['image/jpeg', 'image/jpg', 'image/png']
      const isValidType = validImgs.includes(file.type)
      const isOverflown = file.size < 2 * 1024 * 1024
      if (!isValidType) {
        this.$message.error('unexpected file format: jpg/jpeg/png only')
        return isValidType
      }
      if (!isOverflown) {
        this.$message.error('too large file, maximum size: 2 MB')
        return isOverflown
      }

      return (isValidType && isOverflown)
    },
    onExceed(files, fileList) {
      this.$message.warning(`too many files to upload: ${this.limit} vs ${files.length + fileList.length}`)
    },
    onChange(file, fileList) {
      // this.fileList = fileList.slice(-10);
    },
    onSuccess(response, file, fileList) {
      this.visible = true

      this.uploadedFileList.push(file)

      this.delShowFile(file, fileList)
    },
    onError(err, file, fileList) {
      console.log('error: ', err)

      this.visible = true

      this.uploadedFileList.push(file)

      this.delShowFile(file, fileList)
    },
    onProgress(event, file, fileList) {
      // this.fileList = [file]
    },
    // 将已经完成的文件，包括成功或者失败的文件从展示列表中删除，全部完成之后展示列表为空
    delShowFile(file, fileList) {
      const index = fileList.findIndex(item => {
        return item.uid === file.uid
      })
      if (index !== -1) {
        fileList.splice(index, 1)
      }
    },
    onCopyUrl() {
      var clipboard = new this.Clipboard('#urlCopyButton')
      clipboard.on('success', e => {
        this.$message({
          type: 'success',
          message: 'Copied!'
        })
        clipboard.destroy()
      })

      clipboard.on('error', e => {
        this.$message({
          type: 'error',
          message: 'Copy failed!'
        })
        clipboard.destroy()
      })
    },
    onCopyName() {
      var clipboard = new this.Clipboard('#nameCopyButton')
      clipboard.on('success', e => {
        this.$message({
          type: 'success',
          message: 'Copied!'
        })
        clipboard.destroy()
      })

      clipboard.on('error', e => {
        this.$message({
          type: 'error',
          message: 'Copy failed!'
        })
        clipboard.destroy()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 10px 10px 10px 5px;
  }

  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}

.box-card {
  height: calc(100vh - 1px) !important;

  .upload-entry {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
  }

  .metamask-status {
    box-sizing: border-box;
    // border-radius: 50%;
    top: 10px;
    right: 20px;
    overflow: hidden;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
  }

  .form-title {
    color: #2a323c;
    text-align: center;
    padding: 20px 0 0;
    margin-top: 100px;

    h3 {
      margin: 0 0 30px 0;
    }

    p {
      font-weight: bold;
      color: #898989;
      margin: 0;
    }
  }

  .rule-form {
    width: 100%;
    margin-top: 50px;
  }
}
</style>
