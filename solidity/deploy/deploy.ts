import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPrivateTransfer = await deploy("PrivateTransfer", {
    from: deployer,
    args: ['PrivateTransfer'],
    log: true,
  });

  console.log(`PrivateTransfer contract: `, deployedPrivateTransfer.address);
};
export default func;
func.id = "deploy_fheCounter"; // id required to prevent reexecution
func.tags = ["FHECounter"];
