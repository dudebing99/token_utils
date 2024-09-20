<template>
  <div class="dashboard-container">
    <el-card
      v-loading="loading"
      class="box-card"
      element-loading-text="Moon landing"
      element-loading-spinner="el-icon-loading"
    >
      <div class="metamask-status">
        <svg-icon v-if="!isConnected" icon-class="metamask-grey" style="width: 30px; height: 30px;" />
        <svg-icon v-else icon-class="metamask" style="width: 30px; height: 30px;" />
      </div>
      <div class="form-title">
        <h3>Issue Standard NFT</h3>
        <p>quick, simple, safe to issue NFT</p>
      </div>
      <el-form
        ref="ruleForm"
        :model="ruleForm"
        status-icon
        :rules="rules"
        label-position="right"
        label-width="40%"
        class="rule-form"
      >
        <el-form-item label="NFT Name" prop="tokenName">
          <el-input
            v-model="ruleForm.tokenName"
            type="text"
            maxlength="50"
            placeholder="i.e. Pancake Bunnies"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="NFT Symbol" prop="tokenSymbol">
          <el-input
            v-model="ruleForm.tokenSymbol"
            type="text"
            maxlength="50"
            placeholder="i.e. PB"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="NFT Quantity" prop="quantity">
          <el-input
            v-model="ruleForm.quantity"
            type="text"
            maxlength="20"
            placeholder="i.e. 100(no more than 1000)"
            autocomplete="off"
            style="width: 60%"
            @blur="generateJsonMetadata"
          />
        </el-form-item>
        <el-form-item label="NFT Metadata" prop="metadata">
          <el-input
            v-model="ruleForm.metadata"
            type="textarea"
            rows="10"
            placeholder="check & update the generated json metadata file"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-row :span="24" class="buttonGroup">
          <el-button type="primary" @click="submitForm('ruleForm')">Submit</el-button>
          <el-button @click="resetForm('ruleForm')">Reset</el-button>
          <el-button type="danger" plain disabled>Fees: {{ fees }} IDN</el-button>
        </el-row>
      </el-form>
      <el-divider content-position="center">Contract Address: {{ contractAddress }}</el-divider>
    </el-card>

    <el-dialog title="Contract Information" center :visible.sync="dialogFormVisible" width="80%">
      <el-form :model="contractForm" label-position="right">
        <el-form-item label="NFT Name">
          <el-input v-model="contractForm.tokenName" readonly />
        </el-form-item>
        <el-form-item label="NFT Symbol">
          <el-input v-model="contractForm.tokenSymbol" readonly />
        </el-form-item>
        <el-form-item label="NFT Quantity">
          <el-input v-model="contractForm.quantity" readonly />
        </el-form-item>
        <el-form-item label="Contract Address">
          <el-input v-model="contractForm.address" readonly />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFormVisible = false">Confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>

import { ethers } from 'ethers'
// import { submitMetadata } from '@/api/token'

export default {
  name: 'Issue',
  data() {
    var validate = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('NOT NULL'))
      }
      callback()
    }

    var validateQuantity = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('NOT NULL'))
      }

      if (value > 1000) {
        this.ruleForm.quantity = ''
        this.ruleForm.metadata = ''

        return callback(new Error('No more than 1000'))
      }

      callback()
    }

    return {
      ruleForm: {
        tokenName: '',
        tokenSymbol: '',
        quantity: '',
        metadata: ''
      },
      loading: false,
      baseTokenURI: process.env.VUE_APP_BASE_TOKEN_URI,
      dialogFormVisible: false,
      isConnected: false,
      jsonMetadata: [],
      contractForm: {
        tokenName: '',
        tokenSymbol: '',
        quantity: '',
        address: ''
      },
      fees: '0.01',
      account: '',
      contractAddress: '',
      rules: {
        tokenName: [
          { required: true, validator: validate, trigger: 'blur' }
        ],
        tokenSymbol: [
          { required: true, validator: validate, trigger: 'blur' }
        ],
        quantity: [
          { required: true, validator: validateQuantity, trigger: 'blur' }
        ],
        metadata: [
          { required: true, validator: validate, trigger: 'blur' }
        ]
      }
    }
  },
  async created() {
    await this.init()
  },
  mounted() {
  },
  methods: {
    generateJsonMetadata() {
      this.jsonMetadata = []

      for (var id = 1; id <= this.ruleForm.quantity; id++) {
        this.jsonMetadata.push({
          id: id,
          name: this.ruleForm.tokenSymbol + ' #' + id,
          description: this.ruleForm.tokenName + ", it's #" + id + ' ...',
          image: ''
        })
      }

      if (this.jsonMetadata.length !== 0) {
        this.ruleForm.metadata = JSON.stringify(this.jsonMetadata, null, '  ')
      }
    },
    validateMetadata() {
      try {
        this.jsonMetadata = JSON.parse(this.ruleForm.metadata)
      } catch (err) {
        this.$alert('invalid json format', 'Metadata Error', {
          confirmButtonText: 'Confirm'
        })

        return Promise.resolve(false)
      }

      const len = this.jsonMetadata.length
      if (len !== Number(this.ruleForm.quantity)) {
        this.$alert('metadata items and quantity mismatched', 'Metadata Error', {
          confirmButtonText: 'Confirm'
        })

        return Promise.resolve(false)
      }

      for (const item of this.jsonMetadata) {
        if (!item.id) {
          this.$alert('invalid `id` field', 'Metadata Error', {
            confirmButtonText: 'Confirm'
          })

          return Promise.resolve(false)
        }

        if (!item.name || item.name.length === 0) {
          this.$alert('invalid `name` field', 'Metadata Error', {
            confirmButtonText: 'Confirm'
          })

          return Promise.resolve(false)
        }

        if (!item.description || item.description.length === 0) {
          this.$alert('description `id` field', 'Metadata Error', {
            confirmButtonText: 'Confirm'
          })

          return Promise.resolve(false)
        }

        if (!item.image || item.image.length === 0) {
          this.$alert('invalid `image` field', 'Metadata Error', {
            confirmButtonText: 'Confirm'
          })

          return Promise.resolve(false)
        }
      }

      return Promise.resolve(true)
    },
    async submitForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          const ret = await this.validateMetadata()
          if (!ret) {
            return false
          }

          await this.issueToken()

          this.resetForm(formName)
        } else {
          return false
        }
      })
    },
    resetForm(formName) {
      this.$refs[formName].resetFields()
    },
    async init() {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        this.$alert('Please install MetaMask first.', 'MetaMask Error', {
          confirmButtonText: 'Confirm'
        })
        return
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('chain id: ', chainId)
      this.chainId = chainId

      window.ethereum.on('chainChanged', handleChainChanged)

      function handleChainChanged() {
        // We recommend reloading the page, unless you must do otherwise.
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)

      // eth_accounts always returns an array.
      function handleAccountsChanged(accounts) {
        // this.isConnected = false
        window.location.reload()
      }

      // BNB Smart Chain Mainnet
      if (chainId !== '0x38') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }]
          })
        } catch (switchError) {
          console.log('Error switch wallet:', switchError)
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x38',
                  chainName: 'BNB Smart Chain Mainnet',
                  rpcUrls: [
                    'https://bsc-dataseed1.binance.org/'
                  ],
                  iconUrls: [
                    'https://bscscan.com/token/images/bnbchain2_32.png'],
                  nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                  },
                  blockExplorerUrls: [
                    'https://bscscan.com/'
                  ]
                }
                ]
              })
            } catch (addError) {
              console.log('add error: ', addError)
              // Handle "add" error.
            }
          }
          // Handle other "switch" errors.
        }
      }

      const accounts = await window.ethereum.request({
        'method': 'eth_requestAccounts',
        'params': []
      })
      if (accounts.length !== 0) {
        this.account = accounts[0]
        console.log('account: ', this.account)

        this.isConnected = true
      }
    },
    async issueToken() {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner(this.account)

      try {
        const tokenFactory = new ethers.ContractFactory(
          [
            {
              'inputs': [
                {
                  'internalType': 'string',
                  'name': 'name',
                  'type': 'string'
                },
                {
                  'internalType': 'string',
                  'name': 'symbol',
                  'type': 'string'
                },
                {
                  'internalType': 'uint256',
                  'name': 'quantity',
                  'type': 'uint256'
                },
                {
                  'internalType': 'string',
                  'name': 'uri',
                  'type': 'string'
                }
              ],
              'stateMutability': 'nonpayable',
              'type': 'constructor'
            },
            {
              'inputs': [],
              'name': 'AccessControlBadConfirmation',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                },
                {
                  'internalType': 'bytes32',
                  'name': 'neededRole',
                  'type': 'bytes32'
                }
              ],
              'name': 'AccessControlUnauthorizedAccount',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'sender',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                },
                {
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                }
              ],
              'name': 'ERC721IncorrectOwner',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'operator',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'ERC721InsufficientApproval',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'approver',
                  'type': 'address'
                }
              ],
              'name': 'ERC721InvalidApprover',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'operator',
                  'type': 'address'
                }
              ],
              'name': 'ERC721InvalidOperator',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                }
              ],
              'name': 'ERC721InvalidOwner',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'receiver',
                  'type': 'address'
                }
              ],
              'name': 'ERC721InvalidReceiver',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'sender',
                  'type': 'address'
                }
              ],
              'name': 'ERC721InvalidSender',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'ERC721NonexistentToken',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                },
                {
                  'internalType': 'uint256',
                  'name': 'length',
                  'type': 'uint256'
                }
              ],
              'name': 'StringsInsufficientHexLength',
              'type': 'error'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'approved',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'Approval',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'operator',
                  'type': 'address'
                },
                {
                  'indexed': false,
                  'internalType': 'bool',
                  'name': 'approved',
                  'type': 'bool'
                }
              ],
              'name': 'ApprovalForAll',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': false,
                  'internalType': 'uint256',
                  'name': '_fromTokenId',
                  'type': 'uint256'
                },
                {
                  'indexed': false,
                  'internalType': 'uint256',
                  'name': '_toTokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'BatchMetadataUpdate',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': false,
                  'internalType': 'uint256',
                  'name': '_tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'MetadataUpdate',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'indexed': true,
                  'internalType': 'bytes32',
                  'name': 'previousAdminRole',
                  'type': 'bytes32'
                },
                {
                  'indexed': true,
                  'internalType': 'bytes32',
                  'name': 'newAdminRole',
                  'type': 'bytes32'
                }
              ],
              'name': 'RoleAdminChanged',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'sender',
                  'type': 'address'
                }
              ],
              'name': 'RoleGranted',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'sender',
                  'type': 'address'
                }
              ],
              'name': 'RoleRevoked',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'from',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'indexed': true,
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'Transfer',
              'type': 'event'
            },
            {
              'inputs': [],
              'name': 'DEFAULT_ADMIN_ROLE',
              'outputs': [
                {
                  'internalType': 'bytes32',
                  'name': '',
                  'type': 'bytes32'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [],
              'name': 'MINTER_ROLE',
              'outputs': [
                {
                  'internalType': 'bytes32',
                  'name': '',
                  'type': 'bytes32'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'approve',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                }
              ],
              'name': 'balanceOf',
              'outputs': [
                {
                  'internalType': 'uint256',
                  'name': '',
                  'type': 'uint256'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'getApproved',
              'outputs': [
                {
                  'internalType': 'address',
                  'name': '',
                  'type': 'address'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                }
              ],
              'name': 'getRoleAdmin',
              'outputs': [
                {
                  'internalType': 'bytes32',
                  'name': '',
                  'type': 'bytes32'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                }
              ],
              'name': 'grantRole',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                }
              ],
              'name': 'hasRole',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'operator',
                  'type': 'address'
                }
              ],
              'name': 'isApprovedForAll',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [],
              'name': 'name',
              'outputs': [
                {
                  'internalType': 'string',
                  'name': '',
                  'type': 'string'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'ownerOf',
              'outputs': [
                {
                  'internalType': 'address',
                  'name': '',
                  'type': 'address'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'address',
                  'name': 'callerConfirmation',
                  'type': 'address'
                }
              ],
              'name': 'renounceRole',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 'role',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'address',
                  'name': 'account',
                  'type': 'address'
                }
              ],
              'name': 'revokeRole',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address[]',
                  'name': 'addresses',
                  'type': 'address[]'
                }
              ],
              'name': 'safeBatchMint',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                }
              ],
              'name': 'safeMint',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'from',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'safeTransferFrom',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'from',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                },
                {
                  'internalType': 'bytes',
                  'name': 'data',
                  'type': 'bytes'
                }
              ],
              'name': 'safeTransferFrom',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'operator',
                  'type': 'address'
                },
                {
                  'internalType': 'bool',
                  'name': 'approved',
                  'type': 'bool'
                }
              ],
              'name': 'setApprovalForAll',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes4',
                  'name': 'interfaceId',
                  'type': 'bytes4'
                }
              ],
              'name': 'supportsInterface',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [],
              'name': 'symbol',
              'outputs': [
                {
                  'internalType': 'string',
                  'name': '',
                  'type': 'string'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'tokenURI',
              'outputs': [
                {
                  'internalType': 'string',
                  'name': '',
                  'type': 'string'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'from',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
                }
              ],
              'name': 'transferFrom',
              'outputs': [],
              'stateMutability': 'nonpayable',
              'type': 'function'
            }
          ],
          '608060405234801561000f575f80fd5b50604051613fed380380613fed83398181016040528101906100319190610ed6565b8383815f90816100419190611192565b5080600190816100519190611192565b5050506100665f801b336100d860201b60201c565b506100977f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6336100d860201b60201c565b5080600990816100a79190611192565b505f5b828110156100ce576100c1336101ce60201b60201c565b80806001019150506100aa565b5050505050611463565b5f6100e9838361023660201b60201c565b6101c457600160075f8581526020019081526020015f205f015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff02191690831515021790555061016161029a60201b60201c565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a4600190506101c8565b5f90505b92915050565b7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a66101fe816102a160201b60201c565b61020e60086102c160201b60201c565b5f61021f60086102d560201b60201c565b905061023183826102e160201b60201c565b505050565b5f60075f8481526020019081526020015f205f015f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b5f33905090565b6102be816102b361029a60201b60201c565b61030460201b60201c565b50565b6001815f015f828254019250508190555050565b5f815f01549050919050565b610300828260405180602001604052805f81525061035b60201b60201c565b5050565b610314828261023660201b60201c565b6103575780826040517fe2517d3f00000000000000000000000000000000000000000000000000000000815260040161034e9291906112b8565b60405180910390fd5b5050565b61036b838361038260201b60201c565b61037d5f84848461047b60201b60201c565b505050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036103f2575f6040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016103e991906112df565b60405180910390fd5b5f61040483835f61063360201b60201c565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610476575f6040517f73c6ac6e00000000000000000000000000000000000000000000000000000000815260040161046d91906112df565b60405180910390fd5b505050565b5f8373ffffffffffffffffffffffffffffffffffffffff163b111561062d578273ffffffffffffffffffffffffffffffffffffffff1663150b7a026104c461029a60201b60201c565b8685856040518563ffffffff1660e01b81526004016104e69493929190611359565b6020604051808303815f875af192505050801561052157506040513d601f19601f8201168201806040525081019061051e91906113f8565b60015b6105a2573d805f811461054f576040519150601f19603f3d011682016040523d82523d5f602084013e610554565b606091505b505f81510361059a57836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161059191906112df565b60405180910390fd5b805181602001fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461062b57836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161062291906112df565b60405180910390fd5b505b50505050565b5f806106448461085060201b60201c565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161461068b5761068a81848661088960201b60201c565b5b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461071c576106d05f855f8061095260201b60201c565b600160035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825403925050819055505b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff161461079b57600160035f8773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8460025f8681526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b5f60025f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b61089a838383610b1d60201b60201c565b61094d575f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361090e57806040517f7e2732890000000000000000000000000000000000000000000000000000000081526004016109059190611423565b60405180910390fd5b81816040517f177e802f00000000000000000000000000000000000000000000000000000000815260040161094492919061143c565b60405180910390fd5b505050565b808061098a57505f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b15610ac8575f61099f84610be960201b60201c565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015610a0957508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b8015610a225750610a208184610c7560201b60201c565b155b15610a6457826040517fa9fbf51f000000000000000000000000000000000000000000000000000000008152600401610a5b91906112df565b60405180910390fd5b8115610ac657838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b8360045f8581526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b5f8073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015610be057508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480610b9b5750610b9a8484610c7560201b60201c565b5b80610bdf57508273ffffffffffffffffffffffffffffffffffffffff16610bc783610d0360201b60201c565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b5f80610bfa8361085060201b60201c565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610c6c57826040517f7e273289000000000000000000000000000000000000000000000000000000008152600401610c639190611423565b60405180910390fd5b80915050919050565b5f60055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b5f60045f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b610d9b82610d55565b810181811067ffffffffffffffff82111715610dba57610db9610d65565b5b80604052505050565b5f610dcc610d3c565b9050610dd88282610d92565b919050565b5f67ffffffffffffffff821115610df757610df6610d65565b5b610e0082610d55565b9050602081019050919050565b5f5b83811015610e2a578082015181840152602081019050610e0f565b5f8484015250505050565b5f610e47610e4284610ddd565b610dc3565b905082815260208101848484011115610e6357610e62610d51565b5b610e6e848285610e0d565b509392505050565b5f82601f830112610e8a57610e89610d4d565b5b8151610e9a848260208601610e35565b91505092915050565b5f819050919050565b610eb581610ea3565b8114610ebf575f80fd5b50565b5f81519050610ed081610eac565b92915050565b5f805f8060808587031215610eee57610eed610d45565b5b5f85015167ffffffffffffffff811115610f0b57610f0a610d49565b5b610f1787828801610e76565b945050602085015167ffffffffffffffff811115610f3857610f37610d49565b5b610f4487828801610e76565b9350506040610f5587828801610ec2565b925050606085015167ffffffffffffffff811115610f7657610f75610d49565b5b610f8287828801610e76565b91505092959194509250565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680610fdc57607f821691505b602082108103610fef57610fee610f98565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026110517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611016565b61105b8683611016565b95508019841693508086168417925050509392505050565b5f819050919050565b5f61109661109161108c84610ea3565b611073565b610ea3565b9050919050565b5f819050919050565b6110af8361107c565b6110c36110bb8261109d565b848454611022565b825550505050565b5f90565b6110d76110cb565b6110e28184846110a6565b505050565b5b81811015611105576110fa5f826110cf565b6001810190506110e8565b5050565b601f82111561114a5761111b81610ff5565b61112484611007565b81016020851015611133578190505b61114761113f85611007565b8301826110e7565b50505b505050565b5f82821c905092915050565b5f61116a5f198460080261114f565b1980831691505092915050565b5f611182838361115b565b9150826002028217905092915050565b61119b82610f8e565b67ffffffffffffffff8111156111b4576111b3610d65565b5b6111be8254610fc5565b6111c9828285611109565b5f60209050601f8311600181146111fa575f84156111e8578287015190505b6111f28582611177565b865550611259565b601f19841661120886610ff5565b5f5b8281101561122f5784890151825560018201915060208501945060208101905061120a565b8683101561124c5784890151611248601f89168261115b565b8355505b6001600288020188555050505b505050505050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61128a82611261565b9050919050565b61129a81611280565b82525050565b5f819050919050565b6112b2816112a0565b82525050565b5f6040820190506112cb5f830185611291565b6112d860208301846112a9565b9392505050565b5f6020820190506112f25f830184611291565b92915050565b61130181610ea3565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f61132b82611307565b6113358185611311565b9350611345818560208601610e0d565b61134e81610d55565b840191505092915050565b5f60808201905061136c5f830187611291565b6113796020830186611291565b61138660408301856112f8565b81810360608301526113988184611321565b905095945050505050565b5f7fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6113d7816113a3565b81146113e1575f80fd5b50565b5f815190506113f2816113ce565b92915050565b5f6020828403121561140d5761140c610d45565b5b5f61141a848285016113e4565b91505092915050565b5f6020820190506114365f8301846112f8565b92915050565b5f60408201905061144f5f830185611291565b61145c60208301846112f8565b9392505050565b612b7d806114705f395ff3fe608060405234801561000f575f80fd5b5060043610610140575f3560e01c8063681db87c116100b6578063a22cb4651161007a578063a22cb46514610382578063b88d4fde1461039e578063c87b56dd146103ba578063d5391393146103ea578063d547741f14610408578063e985e9c51461042457610140565b8063681db87c146102ca57806370a08231146102e657806391d148541461031657806395d89b4114610346578063a217fddf1461036457610140565b8063248a9ca311610108578063248a9ca3146101fa5780632f2ff15d1461022a57806336568abe1461024657806340d097c31461026257806342842e0e1461027e5780636352211e1461029a57610140565b806301ffc9a71461014457806306fdde0314610174578063081812fc14610192578063095ea7b3146101c257806323b872dd146101de575b5f80fd5b61015e6004803603810190610159919061205f565b610454565b60405161016b91906120a4565b60405180910390f35b61017c610465565b6040516101899190612147565b60405180910390f35b6101ac60048036038101906101a7919061219a565b6104f4565b6040516101b99190612204565b60405180910390f35b6101dc60048036038101906101d79190612247565b61050f565b005b6101f860048036038101906101f39190612285565b610525565b005b610214600480360381019061020f9190612308565b610624565b6040516102219190612342565b60405180910390f35b610244600480360381019061023f919061235b565b610641565b005b610260600480360381019061025b919061235b565b610663565b005b61027c60048036038101906102779190612399565b6106de565b005b61029860048036038101906102939190612285565b61072e565b005b6102b460048036038101906102af919061219a565b61074d565b6040516102c19190612204565b60405180910390f35b6102e460048036038101906102df9190612425565b61075e565b005b61030060048036038101906102fb9190612399565b6107d8565b60405161030d919061247f565b60405180910390f35b610330600480360381019061032b919061235b565b61088e565b60405161033d91906120a4565b60405180910390f35b61034e6108f2565b60405161035b9190612147565b60405180910390f35b61036c610982565b6040516103799190612342565b60405180910390f35b61039c600480360381019061039791906124c2565b610988565b005b6103b860048036038101906103b39190612628565b61099e565b005b6103d460048036038101906103cf919061219a565b6109bb565b6040516103e19190612147565b60405180910390f35b6103f26109cd565b6040516103ff9190612342565b60405180910390f35b610422600480360381019061041d919061235b565b6109f1565b005b61043e600480360381019061043991906126a8565b610a13565b60405161044b91906120a4565b60405180910390f35b5f61045e82610aa1565b9050919050565b60605f805461047390612713565b80601f016020809104026020016040519081016040528092919081815260200182805461049f90612713565b80156104ea5780601f106104c1576101008083540402835291602001916104ea565b820191905f5260205f20905b8154815290600101906020018083116104cd57829003601f168201915b5050505050905090565b5f6104fe82610b1a565b5061050882610ba0565b9050919050565b610521828261051c610bd9565b610be0565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610595575f6040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161058c9190612204565b60405180910390fd5b5f6105a883836105a3610bd9565b610bf2565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461061e578382826040517f64283d7b00000000000000000000000000000000000000000000000000000000815260040161061593929190612743565b60405180910390fd5b50505050565b5f60075f8381526020019081526020015f20600101549050919050565b61064a82610624565b61065381610dfd565b61065d8383610e11565b50505050565b61066b610bd9565b73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146106cf576040517f6697b23200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6106d98282610efb565b505050565b7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a661070881610dfd565b6107126008610fe5565b5f61071d6008610ff9565b90506107298382611005565b505050565b61074883838360405180602001604052805f81525061099e565b505050565b5f61075782610b1a565b9050919050565b7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a661078881610dfd565b5f5b838390508110156107d2576107c58484838181106107ab576107aa612778565b5b90506020020160208101906107c09190612399565b6106de565b808060010191505061078a565b50505050565b5f8073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610849575f6040517f89c62b640000000000000000000000000000000000000000000000000000000081526004016108409190612204565b60405180910390fd5b60035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b5f60075f8481526020019081526020015f205f015f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b60606001805461090190612713565b80601f016020809104026020016040519081016040528092919081815260200182805461092d90612713565b80156109785780601f1061094f57610100808354040283529160200191610978565b820191905f5260205f20905b81548152906001019060200180831161095b57829003601f168201915b5050505050905090565b5f801b81565b61099a610993610bd9565b8383611022565b5050565b6109a9848484610525565b6109b58484848461118b565b50505050565b60606109c68261133d565b9050919050565b7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a681565b6109fa82610624565b610a0381610dfd565b610a0d8383610efb565b50505050565b5f60055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b5f7f7965db0b000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161480610b135750610b1282611448565b5b9050919050565b5f80610b25836114a8565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610b9757826040517f7e273289000000000000000000000000000000000000000000000000000000008152600401610b8e919061247f565b60405180910390fd5b80915050919050565b5f60045f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b5f33905090565b610bed83838360016114e1565b505050565b5f80610bfd846114a8565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614610c3e57610c3d8184866116a0565b5b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610cc957610c7d5f855f806114e1565b600160035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825403925050819055505b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1614610d4857600160035f8773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8460025f8681526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b610e0e81610e09610bd9565b611763565b50565b5f610e1c838361088e565b610ef157600160075f8581526020019081526020015f205f015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff021916908315150217905550610e8e610bd9565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a460019050610ef5565b5f90505b92915050565b5f610f06838361088e565b15610fdb575f60075f8581526020019081526020015f205f015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff021916908315150217905550610f78610bd9565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16847ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a460019050610fdf565b5f90505b92915050565b6001815f015f828254019250508190555050565b5f815f01549050919050565b61101e828260405180602001604052805f8152506117b4565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361109257816040517f5b08ba180000000000000000000000000000000000000000000000000000000081526004016110899190612204565b60405180910390fd5b8060055f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405161117e91906120a4565b60405180910390a3505050565b5f8373ffffffffffffffffffffffffffffffffffffffff163b1115611337578273ffffffffffffffffffffffffffffffffffffffff1663150b7a026111ce610bd9565b8685856040518563ffffffff1660e01b81526004016111f094939291906127f7565b6020604051808303815f875af192505050801561122b57506040513d601f19601f820116820180604052508101906112289190612855565b60015b6112ac573d805f8114611259576040519150601f19603f3d011682016040523d82523d5f602084013e61125e565b606091505b505f8151036112a457836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161129b9190612204565b60405180910390fd5b805181602001fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461133557836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161132c9190612204565b60405180910390fd5b505b50505050565b606061134882610b1a565b505f60065f8481526020019081526020015f20805461136690612713565b80601f016020809104026020016040519081016040528092919081815260200182805461139290612713565b80156113dd5780601f106113b4576101008083540402835291602001916113dd565b820191905f5260205f20905b8154815290600101906020018083116113c057829003601f168201915b505050505090505f6113ed6117cf565b90505f815103611401578192505050611443565b5f8251111561143557808260405160200161141d9291906128ba565b60405160208183030381529060405292505050611443565b61143e8461183d565b925050505b919050565b5f634906490660e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806114a157506114a0826118a3565b5b9050919050565b5f60025f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b808061151957505f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b1561164b575f61152884610b1a565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415801561159257508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b80156115a557506115a38184610a13565b155b156115e757826040517fa9fbf51f0000000000000000000000000000000000000000000000000000000081526004016115de9190612204565b60405180910390fd5b811561164957838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b8360045f8581526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b6116ab838383611984565b61175e575f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361171f57806040517f7e273289000000000000000000000000000000000000000000000000000000008152600401611716919061247f565b60405180910390fd5b81816040517f177e802f0000000000000000000000000000000000000000000000000000000081526004016117559291906128dd565b60405180910390fd5b505050565b61176d828261088e565b6117b05780826040517fe2517d3f0000000000000000000000000000000000000000000000000000000081526004016117a7929190612904565b60405180910390fd5b5050565b6117be8383611a44565b6117ca5f84848461118b565b505050565b60605f60096117f53073ffffffffffffffffffffffffffffffffffffffff166014611b37565b6040516020016118069291906129bd565b6040516020818303038152906040529050806040516020016118289190612a06565b60405160208183030381529060405291505090565b606061184882610b1a565b505f6118526117cf565b90505f8151116118705760405180602001604052805f81525061189b565b8061187a84611d75565b60405160200161188b9291906128ba565b6040516020818303038152906040525b915050919050565b5f7f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061196d57507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b8061197d575061197c82611e3f565b5b9050919050565b5f8073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015611a3b57508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614806119fc57506119fb8484610a13565b5b80611a3a57508273ffffffffffffffffffffffffffffffffffffffff16611a2283610ba0565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603611ab4575f6040517f64a0ae92000000000000000000000000000000000000000000000000000000008152600401611aab9190612204565b60405180910390fd5b5f611ac083835f610bf2565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614611b32575f6040517f73c6ac6e000000000000000000000000000000000000000000000000000000008152600401611b299190612204565b60405180910390fd5b505050565b60605f8390505f6002846002611b4d9190612a58565b611b579190612a99565b67ffffffffffffffff811115611b7057611b6f612504565b5b6040519080825280601f01601f191660200182016040528015611ba25781602001600182028036833780820191505090505b5090507f3000000000000000000000000000000000000000000000000000000000000000815f81518110611bd957611bd8612778565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191690815f1a9053507f780000000000000000000000000000000000000000000000000000000000000081600181518110611c3c57611c3b612778565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191690815f1a9053505f6001856002611c7a9190612a58565b611c849190612a99565b90505b6001811115611d23577f3031323334353637383961626364656600000000000000000000000000000000600f841660108110611cc657611cc5612778565b5b1a60f81b828281518110611cdd57611cdc612778565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191690815f1a905350600483901c925080611d1c90612acc565b9050611c87565b505f8214611d6a5784846040517fe22e27eb000000000000000000000000000000000000000000000000000000008152600401611d61929190612af3565b60405180910390fd5b809250505092915050565b60605f6001611d8384611ea8565b0190505f8167ffffffffffffffff811115611da157611da0612504565b5b6040519080825280601f01601f191660200182016040528015611dd35781602001600182028036833780820191505090505b5090505f82602001820190505b600115611e34578080600190039150507f3031323334353637383961626364656600000000000000000000000000000000600a86061a8153600a8581611e2957611e28612b1a565b5b0494505f8503611de0575b819350505050919050565b5f7f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b5f805f90507a184f03e93ff9f4daa797ed6e38ed64bf6a1f0100000000000000008310611f04577a184f03e93ff9f4daa797ed6e38ed64bf6a1f0100000000000000008381611efa57611ef9612b1a565b5b0492506040810190505b6d04ee2d6d415b85acef81000000008310611f41576d04ee2d6d415b85acef81000000008381611f3757611f36612b1a565b5b0492506020810190505b662386f26fc100008310611f7057662386f26fc100008381611f6657611f65612b1a565b5b0492506010810190505b6305f5e1008310611f99576305f5e1008381611f8f57611f8e612b1a565b5b0492506008810190505b6127108310611fbe576127108381611fb457611fb3612b1a565b5b0492506004810190505b60648310611fe15760648381611fd757611fd6612b1a565b5b0492506002810190505b600a8310611ff0576001810190505b80915050919050565b5f604051905090565b5f80fd5b5f80fd5b5f7fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b61203e8161200a565b8114612048575f80fd5b50565b5f8135905061205981612035565b92915050565b5f6020828403121561207457612073612002565b5b5f6120818482850161204b565b91505092915050565b5f8115159050919050565b61209e8161208a565b82525050565b5f6020820190506120b75f830184612095565b92915050565b5f81519050919050565b5f82825260208201905092915050565b5f5b838110156120f45780820151818401526020810190506120d9565b5f8484015250505050565b5f601f19601f8301169050919050565b5f612119826120bd565b61212381856120c7565b93506121338185602086016120d7565b61213c816120ff565b840191505092915050565b5f6020820190508181035f83015261215f818461210f565b905092915050565b5f819050919050565b61217981612167565b8114612183575f80fd5b50565b5f8135905061219481612170565b92915050565b5f602082840312156121af576121ae612002565b5b5f6121bc84828501612186565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6121ee826121c5565b9050919050565b6121fe816121e4565b82525050565b5f6020820190506122175f8301846121f5565b92915050565b612226816121e4565b8114612230575f80fd5b50565b5f813590506122418161221d565b92915050565b5f806040838503121561225d5761225c612002565b5b5f61226a85828601612233565b925050602061227b85828601612186565b9150509250929050565b5f805f6060848603121561229c5761229b612002565b5b5f6122a986828701612233565b93505060206122ba86828701612233565b92505060406122cb86828701612186565b9150509250925092565b5f819050919050565b6122e7816122d5565b81146122f1575f80fd5b50565b5f81359050612302816122de565b92915050565b5f6020828403121561231d5761231c612002565b5b5f61232a848285016122f4565b91505092915050565b61233c816122d5565b82525050565b5f6020820190506123555f830184612333565b92915050565b5f806040838503121561237157612370612002565b5b5f61237e858286016122f4565b925050602061238f85828601612233565b9150509250929050565b5f602082840312156123ae576123ad612002565b5b5f6123bb84828501612233565b91505092915050565b5f80fd5b5f80fd5b5f80fd5b5f8083601f8401126123e5576123e46123c4565b5b8235905067ffffffffffffffff811115612402576124016123c8565b5b60208301915083602082028301111561241e5761241d6123cc565b5b9250929050565b5f806020838503121561243b5761243a612002565b5b5f83013567ffffffffffffffff81111561245857612457612006565b5b612464858286016123d0565b92509250509250929050565b61247981612167565b82525050565b5f6020820190506124925f830184612470565b92915050565b6124a18161208a565b81146124ab575f80fd5b50565b5f813590506124bc81612498565b92915050565b5f80604083850312156124d8576124d7612002565b5b5f6124e585828601612233565b92505060206124f6858286016124ae565b9150509250929050565b5f80fd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61253a826120ff565b810181811067ffffffffffffffff8211171561255957612558612504565b5b80604052505050565b5f61256b611ff9565b90506125778282612531565b919050565b5f67ffffffffffffffff82111561259657612595612504565b5b61259f826120ff565b9050602081019050919050565b828183375f83830152505050565b5f6125cc6125c78461257c565b612562565b9050828152602081018484840111156125e8576125e7612500565b5b6125f38482856125ac565b509392505050565b5f82601f83011261260f5761260e6123c4565b5b813561261f8482602086016125ba565b91505092915050565b5f805f80608085870312156126405761263f612002565b5b5f61264d87828801612233565b945050602061265e87828801612233565b935050604061266f87828801612186565b925050606085013567ffffffffffffffff8111156126905761268f612006565b5b61269c878288016125fb565b91505092959194509250565b5f80604083850312156126be576126bd612002565b5b5f6126cb85828601612233565b92505060206126dc85828601612233565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061272a57607f821691505b60208210810361273d5761273c6126e6565b5b50919050565b5f6060820190506127565f8301866121f5565b6127636020830185612470565b61277060408301846121f5565b949350505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffd5b5f81519050919050565b5f82825260208201905092915050565b5f6127c9826127a5565b6127d381856127af565b93506127e38185602086016120d7565b6127ec816120ff565b840191505092915050565b5f60808201905061280a5f8301876121f5565b61281760208301866121f5565b6128246040830185612470565b818103606083015261283681846127bf565b905095945050505050565b5f8151905061284f81612035565b92915050565b5f6020828403121561286a57612869612002565b5b5f61287784828501612841565b91505092915050565b5f81905092915050565b5f612894826120bd565b61289e8185612880565b93506128ae8185602086016120d7565b80840191505092915050565b5f6128c5828561288a565b91506128d1828461288a565b91508190509392505050565b5f6040820190506128f05f8301856121f5565b6128fd6020830184612470565b9392505050565b5f6040820190506129175f8301856121f5565b6129246020830184612333565b9392505050565b5f819050815f5260205f209050919050565b5f815461294981612713565b6129538186612880565b9450600182165f811461296d5760018114612982576129b4565b60ff19831686528115158202860193506129b4565b61298b8561292b565b5f5b838110156129ac5781548189015260018201915060208101905061298d565b838801955050505b50505092915050565b5f6129c8828561293d565b91506129d4828461288a565b91508190509392505050565b7f2f00000000000000000000000000000000000000000000000000000000000000815250565b5f612a11828461288a565b9150612a1c826129e0565b60018201915081905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f612a6282612167565b9150612a6d83612167565b9250828202612a7b81612167565b91508282048414831517612a9257612a91612a2b565b5b5092915050565b5f612aa382612167565b9150612aae83612167565b9250828201905080821115612ac657612ac5612a2b565b5b92915050565b5f612ad682612167565b91505f8203612ae857612ae7612a2b565b5b600182039050919050565b5f604082019050612b065f830185612470565b612b136020830184612470565b9392505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffdfea2646970667358221220e9aa77eb9a898a63b034cbfcecdc4df2dc8848b3be695e9e5a76464a574138a864736f6c634300081a0033',
          signer
        )

        // const valueInWei = ethers.utils.parseEther(this.fees)

        console.log('nft name: ', this.ruleForm.tokenName, ', nft symbol: ', this.ruleForm.tokenSymbol, ', nft quantity: ', this.ruleForm.quantity, ', fees: ',
          this.fees, ', base uri: ', this.baseTokenURI)

        this.loading = true

        // const contractERC721 = await tokenFactory.deploy(this.ruleForm.tokenName, this.ruleForm.tokenSymbol, this.ruleForm.quantity, this.baseTokenURI,
        //   { value: valueInWei })
        const contractERC721 = await tokenFactory.deploy(this.ruleForm.tokenName, this.ruleForm.tokenSymbol, this.ruleForm.quantity, this.baseTokenURI)

        await contractERC721.deployed()

        this.contractAddress = contractERC721.address
        console.log('contract address: ', contractERC721.address, ', hash: ', contractERC721.deployTransaction.hash)

        // Attention: you need to handle NFT's metadata files which refer to `baseTokenURI`.
        // submitMetadata({
        //   contractAddress: this.contractAddress,
        //   jsonMetadata: this.jsonMetadata
        // }).then(res => {
        //   console.log('res: ', res)
        // }).catch(e => {
        //   console.log('error: ', e)
        // })

        this.loading = false

        this.contractForm.tokenName = this.ruleForm.tokenName
        this.contractForm.tokenSymbol = this.ruleForm.tokenSymbol
        this.contractForm.quantity = this.ruleForm.quantity
        this.contractForm.address = this.contractAddress
        this.dialogFormVisible = true
      } catch (error) {
        console.error('Error issue token:', error)

        this.loading = false

        this.$alert('An error occurred while issue the token.', 'Error', {
          confirmButtonText: 'Confirm'
        })
      }
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
  height: calc(100vh - 30px) !important;

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

    .buttonGroup {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
