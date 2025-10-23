这个一个基于zama隐私转账的dapp
一下路径是已经开发好的合约abi
zama-program/frontend/src/constant/abi.json
这是sepolia合约地址0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D
rpc使用https://1rpc.io/sepolia
我先罗列下该dapp的所有功能
1、需要有一个连接钱包插件的功能，可以使用@web3modal/ethers/vue
2、主题色为黑色，按钮的颜色使用#6e54ff
3、开发需要美观，贴近web3的风格
4、目前有三种存款方式，存款使用abi的deposit，_transferType 1 为指定领取人的存款，2为不指定领取人的存款，3为委托领取人的存款，我来描述一下各个类型的功能，指定领取人就是存款之后必须得是该领取人才有办法领取存款，不指定领取人就是什么人都可以通过password去领取存款，委托领取人就是委托人通过password为指定领取人领取存款。也就是类型1和类型3都必须输入指定领取人，类型2指定人可以不用输入，但是发请求的时候指定人给定一个黑洞地址
5、页面全用英文来写
6、领取存款的时候需要输入私钥，私钥转成uint256，类似BigInt(ethers.keccak256(passwordWallet.privateKey))，然后先获取存款的详细信息，用abi getVault获取出信息，然后用私钥解密出信息，zama的@zama-fhe/relayer-sdk，加密参数也是用@zama-fhe/relayer-sdk
7、需要有一个赏金列表，getTasks 去获取全部任务，然后获取fee佣金比例，(金额 * 佣金比例/1000) * 100，这个列表任何人都可以发起，使用的是entrustWithdraw 这个abi
8、然后你每完成一项都需要记录日志，详细的记录已经完成了什么东西。
