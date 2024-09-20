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
        <h3>Issue Standard Token</h3>
        <p>quick, simple, safe to issue token</p>
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
        <el-form-item label="Token Name" prop="tokenName">
          <el-input
            v-model="ruleForm.tokenName"
            type="text"
            maxlength="50"
            placeholder="i.e. Tether USD"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="Token Symbol" prop="tokenSymbol">
          <el-input
            v-model="ruleForm.tokenSymbol"
            type="text"
            maxlength="50"
            placeholder="i.e. USDT"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="Total Supply" prop="totalSupply">
          <el-input
            v-model="ruleForm.totalSupply"
            type="text"
            maxlength="20"
            placeholder="i.e. 10000"
            autocomplete="off"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="Decimals" prop="decimals">
          <el-input type="text" readonly value="18" style="width: 60%" />
        </el-form-item>
        <el-row :span="24" class="buttonGroup">
          <el-button type="primary" @click="submitForm('ruleForm')">Submit</el-button>
          <el-button @click="resetForm('ruleForm')">Reset</el-button>
          <el-button type="danger" plain disabled>Fees: {{ fees }} BNB</el-button>
        </el-row>
      </el-form>
      <el-divider content-position="center">Contract Address: {{ contractAddress }}</el-divider>
    </el-card>

    <el-dialog title="Contract Information" center :visible.sync="dialogFormVisible" width="80%">
      <el-form :model="contractForm" label-position="right">
        <el-form-item label="Token Name">
          <el-input v-model="contractForm.tokenName" readonly />
        </el-form-item>
        <el-form-item label="Token Symbol">
          <el-input v-model="contractForm.tokenSymbol" readonly />
        </el-form-item>
        <el-form-item label="Total Supply">
          <el-input v-model="contractForm.totalSupply" readonly />
        </el-form-item>
        <el-form-item label="Decimals">
          <el-input type="text" readonly value="18" />
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

export default {
  name: 'Issue',
  data() {
    var validate = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('NOT NULL'))
      }
      callback()
    }

    return {
      ruleForm: {
        tokenName: '',
        tokenSymbol: '',
        totalSupply: ''
      },
      loading: false,
      dialogFormVisible: false,
      isConnected: false,
      contractForm: {
        tokenName: '',
        tokenSymbol: '',
        totalSupply: '',
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
        totalSupply: [
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
    submitForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
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
        this.$alert('Please install MetaMask first.', 'Error', {
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
                  'name': 'initialSupply',
                  'type': 'uint256'
                }
              ],
              'stateMutability': 'nonpayable',
              'type': 'constructor'
            },
            {
              'inputs': [],
              'name': 'ECDSAInvalidSignature',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'length',
                  'type': 'uint256'
                }
              ],
              'name': 'ECDSAInvalidSignatureLength',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'bytes32',
                  'name': 's',
                  'type': 'bytes32'
                }
              ],
              'name': 'ECDSAInvalidSignatureS',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'spender',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'allowance',
                  'type': 'uint256'
                },
                {
                  'internalType': 'uint256',
                  'name': 'needed',
                  'type': 'uint256'
                }
              ],
              'name': 'ERC20InsufficientAllowance',
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
                  'name': 'balance',
                  'type': 'uint256'
                },
                {
                  'internalType': 'uint256',
                  'name': 'needed',
                  'type': 'uint256'
                }
              ],
              'name': 'ERC20InsufficientBalance',
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
              'name': 'ERC20InvalidApprover',
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
              'name': 'ERC20InvalidReceiver',
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
              'name': 'ERC20InvalidSender',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'spender',
                  'type': 'address'
                }
              ],
              'name': 'ERC20InvalidSpender',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'uint256',
                  'name': 'deadline',
                  'type': 'uint256'
                }
              ],
              'name': 'ERC2612ExpiredSignature',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'signer',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                }
              ],
              'name': 'ERC2612InvalidSigner',
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
                  'internalType': 'uint256',
                  'name': 'currentNonce',
                  'type': 'uint256'
                }
              ],
              'name': 'InvalidAccountNonce',
              'type': 'error'
            },
            {
              'inputs': [],
              'name': 'InvalidShortString',
              'type': 'error'
            },
            {
              'inputs': [
                {
                  'internalType': 'string',
                  'name': 'str',
                  'type': 'string'
                }
              ],
              'name': 'StringTooLong',
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
                  'name': 'spender',
                  'type': 'address'
                },
                {
                  'indexed': false,
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                }
              ],
              'name': 'Approval',
              'type': 'event'
            },
            {
              'anonymous': false,
              'inputs': [],
              'name': 'EIP712DomainChanged',
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
                  'indexed': false,
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                }
              ],
              'name': 'Transfer',
              'type': 'event'
            },
            {
              'inputs': [],
              'name': 'DOMAIN_SEPARATOR',
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
                  'name': 'owner',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'spender',
                  'type': 'address'
                }
              ],
              'name': 'allowance',
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
                  'internalType': 'address',
                  'name': 'spender',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                }
              ],
              'name': 'approve',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
              'stateMutability': 'nonpayable',
              'type': 'function'
            },
            {
              'inputs': [
                {
                  'internalType': 'address',
                  'name': 'account',
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
              'inputs': [],
              'name': 'decimals',
              'outputs': [
                {
                  'internalType': 'uint8',
                  'name': '',
                  'type': 'uint8'
                }
              ],
              'stateMutability': 'view',
              'type': 'function'
            },
            {
              'inputs': [],
              'name': 'eip712Domain',
              'outputs': [
                {
                  'internalType': 'bytes1',
                  'name': 'fields',
                  'type': 'bytes1'
                },
                {
                  'internalType': 'string',
                  'name': 'name',
                  'type': 'string'
                },
                {
                  'internalType': 'string',
                  'name': 'version',
                  'type': 'string'
                },
                {
                  'internalType': 'uint256',
                  'name': 'chainId',
                  'type': 'uint256'
                },
                {
                  'internalType': 'address',
                  'name': 'verifyingContract',
                  'type': 'address'
                },
                {
                  'internalType': 'bytes32',
                  'name': 'salt',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'uint256[]',
                  'name': 'extensions',
                  'type': 'uint256[]'
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
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                }
              ],
              'name': 'nonces',
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
                  'internalType': 'address',
                  'name': 'owner',
                  'type': 'address'
                },
                {
                  'internalType': 'address',
                  'name': 'spender',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                },
                {
                  'internalType': 'uint256',
                  'name': 'deadline',
                  'type': 'uint256'
                },
                {
                  'internalType': 'uint8',
                  'name': 'v',
                  'type': 'uint8'
                },
                {
                  'internalType': 'bytes32',
                  'name': 'r',
                  'type': 'bytes32'
                },
                {
                  'internalType': 'bytes32',
                  'name': 's',
                  'type': 'bytes32'
                }
              ],
              'name': 'permit',
              'outputs': [],
              'stateMutability': 'nonpayable',
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
              'inputs': [],
              'name': 'totalSupply',
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
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
                },
                {
                  'internalType': 'uint256',
                  'name': 'value',
                  'type': 'uint256'
                }
              ],
              'name': 'transfer',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
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
                  'name': 'value',
                  'type': 'uint256'
                }
              ],
              'name': 'transferFrom',
              'outputs': [
                {
                  'internalType': 'bool',
                  'name': '',
                  'type': 'bool'
                }
              ],
              'stateMutability': 'nonpayable',
              'type': 'function'
            }
          ],
          '610160604052348015610010575f80fd5b50604051612866380380612866833981810160405281019061003291906106d3565b6040518060400160405280600581526020017f546f6b656e000000000000000000000000000000000000000000000000000000815250806040518060400160405280600181526020017f3100000000000000000000000000000000000000000000000000000000000000815250858581600390816100b0919061095f565b5080600490816100c0919061095f565b5050506100d760058361018660201b90919060201c565b61012081815250506100f360068261018660201b90919060201c565b6101408181525050818051906020012060e08181525050808051906020012061010081815250504660a081815250506101306101d360201b60201c565b608081815250503073ffffffffffffffffffffffffffffffffffffffff1660c08173ffffffffffffffffffffffffffffffffffffffff168152505050505061017e338261022d60201b60201c565b505050610ca7565b5f6020835110156101a7576101a0836102b260201b60201c565b90506101cd565b826101b78361031760201b60201c565b5f0190816101c5919061095f565b5060ff5f1b90505b92915050565b5f7f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60e051610100514630604051602001610212959493929190610a94565b60405160208183030381529060405280519060200120905090565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361029d575f6040517fec442f050000000000000000000000000000000000000000000000000000000081526004016102949190610ae5565b60405180910390fd5b6102ae5f838361032060201b60201c565b5050565b5f80829050601f815111156102fe57826040517f305a27a90000000000000000000000000000000000000000000000000000000081526004016102f59190610b46565b60405180910390fd5b80518161030a90610b93565b5f1c175f1b915050919050565b5f819050919050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610370578060025f8282546103649190610c26565b9250508190555061043e565b5f805f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050818110156103f9578381836040517fe450d38c0000000000000000000000000000000000000000000000000000000081526004016103f093929190610c59565b60405180910390fd5b8181035f808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610485578060025f82825403925050819055506104cf565b805f808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161052c9190610c8e565b60405180910390a3505050565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61059882610552565b810181811067ffffffffffffffff821117156105b7576105b6610562565b5b80604052505050565b5f6105c9610539565b90506105d5828261058f565b919050565b5f67ffffffffffffffff8211156105f4576105f3610562565b5b6105fd82610552565b9050602081019050919050565b5f5b8381101561062757808201518184015260208101905061060c565b5f8484015250505050565b5f61064461063f846105da565b6105c0565b9050828152602081018484840111156106605761065f61054e565b5b61066b84828561060a565b509392505050565b5f82601f8301126106875761068661054a565b5b8151610697848260208601610632565b91505092915050565b5f819050919050565b6106b2816106a0565b81146106bc575f80fd5b50565b5f815190506106cd816106a9565b92915050565b5f805f606084860312156106ea576106e9610542565b5b5f84015167ffffffffffffffff81111561070757610706610546565b5b61071386828701610673565b935050602084015167ffffffffffffffff81111561073457610733610546565b5b61074086828701610673565b9250506040610751868287016106bf565b9150509250925092565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806107a957607f821691505b6020821081036107bc576107bb610765565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f6008830261081e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826107e3565b61082886836107e3565b95508019841693508086168417925050509392505050565b5f819050919050565b5f61086361085e610859846106a0565b610840565b6106a0565b9050919050565b5f819050919050565b61087c83610849565b6108906108888261086a565b8484546107ef565b825550505050565b5f90565b6108a4610898565b6108af818484610873565b505050565b5b818110156108d2576108c75f8261089c565b6001810190506108b5565b5050565b601f821115610917576108e8816107c2565b6108f1846107d4565b81016020851015610900578190505b61091461090c856107d4565b8301826108b4565b50505b505050565b5f82821c905092915050565b5f6109375f198460080261091c565b1980831691505092915050565b5f61094f8383610928565b9150826002028217905092915050565b6109688261075b565b67ffffffffffffffff81111561098157610980610562565b5b61098b8254610792565b6109968282856108d6565b5f60209050601f8311600181146109c7575f84156109b5578287015190505b6109bf8582610944565b865550610a26565b601f1984166109d5866107c2565b5f5b828110156109fc578489015182556001820191506020850194506020810190506109d7565b86831015610a195784890151610a15601f891682610928565b8355505b6001600288020188555050505b505050505050565b5f819050919050565b610a4081610a2e565b82525050565b610a4f816106a0565b82525050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610a7e82610a55565b9050919050565b610a8e81610a74565b82525050565b5f60a082019050610aa75f830188610a37565b610ab46020830187610a37565b610ac16040830186610a37565b610ace6060830185610a46565b610adb6080830184610a85565b9695505050505050565b5f602082019050610af85f830184610a85565b92915050565b5f82825260208201905092915050565b5f610b188261075b565b610b228185610afe565b9350610b3281856020860161060a565b610b3b81610552565b840191505092915050565b5f6020820190508181035f830152610b5e8184610b0e565b905092915050565b5f81519050919050565b5f819050602082019050919050565b5f610b8a8251610a2e565b80915050919050565b5f610b9d82610b66565b82610ba784610b70565b9050610bb281610b7f565b92506020821015610bf257610bed7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff836020036008026107e3565b831692505b5050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610c30826106a0565b9150610c3b836106a0565b9250828201905080821115610c5357610c52610bf9565b5b92915050565b5f606082019050610c6c5f830186610a85565b610c796020830185610a46565b610c866040830184610a46565b949350505050565b5f602082019050610ca15f830184610a46565b92915050565b60805160a05160c05160e051610100516101205161014051611b6e610cf85f395f610a1501525f6109da01525f610f0e01525f610eed01525f6108d801525f61092e01525f6109570152611b6e5ff3fe608060405234801561000f575f80fd5b50600436106100cd575f3560e01c806370a082311161008a57806395d89b411161006457806395d89b411461022d578063a9059cbb1461024b578063d505accf1461027b578063dd62ed3e14610297576100cd565b806370a08231146101a95780637ecebe00146101d957806384b0196e14610209576100cd565b806306fdde03146100d1578063095ea7b3146100ef57806318160ddd1461011f57806323b872dd1461013d578063313ce5671461016d5780633644e5151461018b575b5f80fd5b6100d96102c7565b6040516100e691906113de565b60405180910390f35b6101096004803603810190610104919061148f565b610357565b60405161011691906114e7565b60405180910390f35b610127610379565b604051610134919061150f565b60405180910390f35b61015760048036038101906101529190611528565b610382565b60405161016491906114e7565b60405180910390f35b6101756103b0565b6040516101829190611593565b60405180910390f35b6101936103b8565b6040516101a091906115c4565b60405180910390f35b6101c360048036038101906101be91906115dd565b6103c6565b6040516101d0919061150f565b60405180910390f35b6101f360048036038101906101ee91906115dd565b61040b565b604051610200919061150f565b60405180910390f35b61021161041c565b6040516102249796959493929190611708565b60405180910390f35b6102356104c1565b60405161024291906113de565b60405180910390f35b6102656004803603810190610260919061148f565b610551565b60405161027291906114e7565b60405180910390f35b610295600480360381019061029091906117de565b610573565b005b6102b160048036038101906102ac919061187b565b6106b8565b6040516102be919061150f565b60405180910390f35b6060600380546102d6906118e6565b80601f0160208091040260200160405190810160405280929190818152602001828054610302906118e6565b801561034d5780601f106103245761010080835404028352916020019161034d565b820191905f5260205f20905b81548152906001019060200180831161033057829003601f168201915b5050505050905090565b5f8061036161073a565b905061036e818585610741565b600191505092915050565b5f600254905090565b5f8061038c61073a565b9050610399858285610753565b6103a48585856107e5565b60019150509392505050565b5f6012905090565b5f6103c16108d5565b905090565b5f805f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b5f6104158261098b565b9050919050565b5f6060805f805f606061042d6109d1565b610435610a0c565b46305f801b5f67ffffffffffffffff81111561045457610453611916565b5b6040519080825280602002602001820160405280156104825781602001602082028036833780820191505090505b507f0f00000000000000000000000000000000000000000000000000000000000000959493929190965096509650965096509650965090919293949596565b6060600480546104d0906118e6565b80601f01602080910402602001604051908101604052809291908181526020018280546104fc906118e6565b80156105475780601f1061051e57610100808354040283529160200191610547565b820191905f5260205f20905b81548152906001019060200180831161052a57829003601f168201915b5050505050905090565b5f8061055b61073a565b90506105688185856107e5565b600191505092915050565b834211156105b857836040517f627913020000000000000000000000000000000000000000000000000000000081526004016105af919061150f565b60405180910390fd5b5f7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886105e68c610a47565b896040516020016105fc96959493929190611943565b6040516020818303038152906040528051906020012090505f61061e82610a9a565b90505f61062d82878787610ab3565b90508973ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146106a157808a6040517f4b800e460000000000000000000000000000000000000000000000000000000081526004016106989291906119a2565b60405180910390fd5b6106ac8a8a8a610741565b50505050505050505050565b5f60015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905092915050565b5f33905090565b61074e8383836001610ae1565b505050565b5f61075e84846106b8565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146107df57818110156107d0578281836040517ffb8f41b20000000000000000000000000000000000000000000000000000000081526004016107c7939291906119c9565b60405180910390fd5b6107de84848484035f610ae1565b5b50505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610855575f6040517f96c6fd1e00000000000000000000000000000000000000000000000000000000815260040161084c91906119fe565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036108c5575f6040517fec442f050000000000000000000000000000000000000000000000000000000081526004016108bc91906119fe565b60405180910390fd5b6108d0838383610cb0565b505050565b5f7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff1614801561095057507f000000000000000000000000000000000000000000000000000000000000000046145b1561097d577f00000000000000000000000000000000000000000000000000000000000000009050610988565b610985610ec9565b90505b90565b5f60075f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b6060610a0760057f0000000000000000000000000000000000000000000000000000000000000000610f5e90919063ffffffff16565b905090565b6060610a4260067f0000000000000000000000000000000000000000000000000000000000000000610f5e90919063ffffffff16565b905090565b5f60075f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f815480929190600101919050559050919050565b5f610aac610aa66108d5565b8361100b565b9050919050565b5f805f80610ac38888888861104b565b925092509250610ad38282611132565b829350505050949350505050565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1603610b51575f6040517fe602df05000000000000000000000000000000000000000000000000000000008152600401610b4891906119fe565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610bc1575f6040517f94280d62000000000000000000000000000000000000000000000000000000008152600401610bb891906119fe565b60405180910390fd5b8160015f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055508015610caa578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610ca1919061150f565b60405180910390a35b50505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610d00578060025f828254610cf49190611a44565b92505081905550610dce565b5f805f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610d89578381836040517fe450d38c000000000000000000000000000000000000000000000000000000008152600401610d80939291906119c9565b60405180910390fd5b8181035f808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610e15578060025f8282540392505081905550610e5f565b805f808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610ebc919061150f565b60405180910390a3505050565b5f7f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f7f00000000000000000000000000000000000000000000000000000000000000007f00000000000000000000000000000000000000000000000000000000000000004630604051602001610f43959493929190611a77565b60405160208183030381529060405280519060200120905090565b606060ff5f1b8314610f7a57610f7383611294565b9050611005565b818054610f86906118e6565b80601f0160208091040260200160405190810160405280929190818152602001828054610fb2906118e6565b8015610ffd5780601f10610fd457610100808354040283529160200191610ffd565b820191905f5260205f20905b815481529060010190602001808311610fe057829003601f168201915b505050505090505b92915050565b5f6040517f190100000000000000000000000000000000000000000000000000000000000081528360028201528260228201526042812091505092915050565b5f805f7f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0845f1c1115611087575f600385925092509250611128565b5f6001888888886040515f81526020016040526040516110aa9493929190611ac8565b6020604051602081039080840390855afa1580156110ca573d5f803e3d5ffd5b5050506020604051035190505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361111b575f60015f801b93509350935050611128565b805f805f1b935093509350505b9450945094915050565b5f600381111561114557611144611b0b565b5b82600381111561115857611157611b0b565b5b0315611290576001600381111561117257611171611b0b565b5b82600381111561118557611184611b0b565b5b036111bc576040517ff645eedf00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600260038111156111d0576111cf611b0b565b5b8260038111156111e3576111e2611b0b565b5b0361122757805f1c6040517ffce698f700000000000000000000000000000000000000000000000000000000815260040161121e919061150f565b60405180910390fd5b60038081111561123a57611239611b0b565b5b82600381111561124d5761124c611b0b565b5b0361128f57806040517fd78bce0c00000000000000000000000000000000000000000000000000000000815260040161128691906115c4565b60405180910390fd5b5b5050565b60605f6112a083611306565b90505f602067ffffffffffffffff8111156112be576112bd611916565b5b6040519080825280601f01601f1916602001820160405280156112f05781602001600182028036833780820191505090505b5090508181528360208201528092505050919050565b5f8060ff835f1c169050601f81111561134b576040517fb3512b0c00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b80915050919050565b5f81519050919050565b5f82825260208201905092915050565b5f5b8381101561138b578082015181840152602081019050611370565b5f8484015250505050565b5f601f19601f8301169050919050565b5f6113b082611354565b6113ba818561135e565b93506113ca81856020860161136e565b6113d381611396565b840191505092915050565b5f6020820190508181035f8301526113f681846113a6565b905092915050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61142b82611402565b9050919050565b61143b81611421565b8114611445575f80fd5b50565b5f8135905061145681611432565b92915050565b5f819050919050565b61146e8161145c565b8114611478575f80fd5b50565b5f8135905061148981611465565b92915050565b5f80604083850312156114a5576114a46113fe565b5b5f6114b285828601611448565b92505060206114c38582860161147b565b9150509250929050565b5f8115159050919050565b6114e1816114cd565b82525050565b5f6020820190506114fa5f8301846114d8565b92915050565b6115098161145c565b82525050565b5f6020820190506115225f830184611500565b92915050565b5f805f6060848603121561153f5761153e6113fe565b5b5f61154c86828701611448565b935050602061155d86828701611448565b925050604061156e8682870161147b565b9150509250925092565b5f60ff82169050919050565b61158d81611578565b82525050565b5f6020820190506115a65f830184611584565b92915050565b5f819050919050565b6115be816115ac565b82525050565b5f6020820190506115d75f8301846115b5565b92915050565b5f602082840312156115f2576115f16113fe565b5b5f6115ff84828501611448565b91505092915050565b5f7fff0000000000000000000000000000000000000000000000000000000000000082169050919050565b61163c81611608565b82525050565b61164b81611421565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f819050602082019050919050565b6116838161145c565b82525050565b5f611694838361167a565b60208301905092915050565b5f602082019050919050565b5f6116b682611651565b6116c0818561165b565b93506116cb8361166b565b805f5b838110156116fb5781516116e28882611689565b97506116ed836116a0565b9250506001810190506116ce565b5085935050505092915050565b5f60e08201905061171b5f83018a611633565b818103602083015261172d81896113a6565b9050818103604083015261174181886113a6565b90506117506060830187611500565b61175d6080830186611642565b61176a60a08301856115b5565b81810360c083015261177c81846116ac565b905098975050505050505050565b61179381611578565b811461179d575f80fd5b50565b5f813590506117ae8161178a565b92915050565b6117bd816115ac565b81146117c7575f80fd5b50565b5f813590506117d8816117b4565b92915050565b5f805f805f805f60e0888a0312156117f9576117f86113fe565b5b5f6118068a828b01611448565b97505060206118178a828b01611448565b96505060406118288a828b0161147b565b95505060606118398a828b0161147b565b945050608061184a8a828b016117a0565b93505060a061185b8a828b016117ca565b92505060c061186c8a828b016117ca565b91505092959891949750929550565b5f8060408385031215611891576118906113fe565b5b5f61189e85828601611448565b92505060206118af85828601611448565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806118fd57607f821691505b6020821081036119105761190f6118b9565b5b50919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b5f60c0820190506119565f8301896115b5565b6119636020830188611642565b6119706040830187611642565b61197d6060830186611500565b61198a6080830185611500565b61199760a0830184611500565b979650505050505050565b5f6040820190506119b55f830185611642565b6119c26020830184611642565b9392505050565b5f6060820190506119dc5f830186611642565b6119e96020830185611500565b6119f66040830184611500565b949350505050565b5f602082019050611a115f830184611642565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f611a4e8261145c565b9150611a598361145c565b9250828201905080821115611a7157611a70611a17565b5b92915050565b5f60a082019050611a8a5f8301886115b5565b611a9760208301876115b5565b611aa460408301866115b5565b611ab16060830185611500565b611abe6080830184611642565b9695505050505050565b5f608082019050611adb5f8301876115b5565b611ae86020830186611584565b611af560408301856115b5565b611b0260608301846115b5565b95945050505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602160045260245ffdfea26469706673582212202c79d531b5e4ef149dba68507e2e28fe0329b8434bab89c2a6fcf25f15247a4864736f6c634300081a0033',
          signer
        )

        const totalSupplyInWei = ethers.utils.parseUnits(this.ruleForm.totalSupply, 18)
        // const valueInWei = ethers.utils.parseEther(this.fees)
        console.log('token name: ', this.ruleForm.tokenName, ', token symbol: ', this.ruleForm.tokenSymbol, ', initial supply: ', this.ruleForm.totalSupply, ', fees: ', this.fees)

        this.loading = true

        // If you want to charge, use `value` parameter. In addition, replace the contract related parameters.
        // const contractERC20 = await tokenFactory.deploy(this.ruleForm.tokenName, this.ruleForm.tokenSymbol, totalSupplyInWei, { value: valueInWei })
        const contractERC20 = await tokenFactory.deploy(this.ruleForm.tokenName, this.ruleForm.tokenSymbol, totalSupplyInWei)
        await contractERC20.deployed()

        this.contractAddress = contractERC20.address
        console.log('contract address: ', contractERC20.address, ', hash: ', contractERC20.deployTransaction.hash)
        this.loading = false

        this.contractForm.tokenName = this.ruleForm.tokenName
        this.contractForm.tokenSymbol = this.ruleForm.tokenSymbol
        this.contractForm.totalSupply = this.ruleForm.totalSupply
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
