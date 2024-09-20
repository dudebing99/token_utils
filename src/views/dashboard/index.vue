<template>
  <div class="dashboard-container">
    <el-card class="box-card">
      <el-row>
        <div class="welcome">Welcome to Token Utils</div>
      </el-row>
    </el-card>
  </div>
</template>

<script>
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
  height: calc(100vh - 30px) !important;
  display: flex;
  justify-content: center;
  align-items: center;

  .welcome {
    font-size: 40px;
    text-shadow: 2px 2px 2px #898989;
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
