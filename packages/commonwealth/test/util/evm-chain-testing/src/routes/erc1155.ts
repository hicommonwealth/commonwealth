import { Request, Response } from 'express';
import { AbiItem } from 'web3-utils';
import { erc1155Mint } from '../types';
import erc_1155_abi from '../utils/abi/erc1155';
import { erc_1155 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

/**
 * Generated by compiling the following contract on remix:
 *
 * pragma solidity ^0.8.20;
 * import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol";
 *
 * contract TestErc1155 is ERC1155 {
 *   constructor() ERC1155('uri') {}
 *
 *   function mint(address to, uint256 id, uint256 value) external {
 *     _mint(to, id, value, "");
 *   }
 * }
 */

const testErc1155Bytecode =
  // eslint-disable-next-line
  '608060405234801562000010575f80fd5b506040518060400160405280600381526020017f757269000000000000000000000000000000000000000000000000000000000081525062000058816200005f60201b60201c565b50620003bc565b8060029081620000709190620002d8565b5050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680620000f057607f821691505b602082108103620001065762000105620000ab565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026200016a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826200012d565b6200017686836200012d565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f620001c0620001ba620001b4846200018e565b62000197565b6200018e565b9050919050565b5f819050919050565b620001db83620001a0565b620001f3620001ea82620001c7565b84845462000139565b825550505050565b5f90565b62000209620001fb565b62000216818484620001d0565b505050565b5b818110156200023d57620002315f82620001ff565b6001810190506200021c565b5050565b601f8211156200028c5762000256816200010c565b62000261846200011e565b8101602085101562000271578190505b6200028962000280856200011e565b8301826200021b565b50505b505050565b5f82821c905092915050565b5f620002ae5f198460080262000291565b1980831691505092915050565b5f620002c883836200029d565b9150826002028217905092915050565b620002e38262000074565b67ffffffffffffffff811115620002ff57620002fe6200007e565b5b6200030b8254620000d8565b6200031882828562000241565b5f60209050601f8311600181146200034e575f841562000339578287015190505b620003458582620002bb565b865550620003b4565b601f1984166200035e866200010c565b5f5b82811015620003875784890151825560018201915060208501945060208101905062000360565b86831015620003a75784890151620003a3601f8916826200029d565b8355505b6001600288020188555050505b505050505050565b611fb980620003ca5f395ff3fe608060405234801561000f575f80fd5b5060043610610090575f3560e01c80632eb2c2d6116100645780632eb2c2d6146101405780634e1273f41461015c578063a22cb4651461018c578063e985e9c5146101a8578063f242432a146101d857610090565b8062fdd58e1461009457806301ffc9a7146100c45780630e89341c146100f4578063156e29f614610124575b5f80fd5b6100ae60048036038101906100a991906113d6565b6101f4565b6040516100bb9190611423565b60405180910390f35b6100de60048036038101906100d99190611491565b610249565b6040516100eb91906114d6565b60405180910390f35b61010e600480360381019061010991906114ef565b61032a565b60405161011b91906115a4565b60405180910390f35b61013e600480360381019061013991906115c4565b6103bc565b005b61015a60048036038101906101559190611804565b6103db565b005b6101766004803603810190610171919061198f565b610482565b6040516101839190611abc565b60405180910390f35b6101a660048036038101906101a19190611b06565b61058f565b005b6101c260048036038101906101bd9190611b44565b6105a5565b6040516101cf91906114d6565b60405180910390f35b6101f260048036038101906101ed9190611b82565b610633565b005b5f805f8381526020019081526020015f205f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905092915050565b5f7fd9b67a26000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061031357507f0e89341c000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806103235750610322826106da565b5b9050919050565b60606002805461033990611c42565b80601f016020809104026020016040519081016040528092919081815260200182805461036590611c42565b80156103b05780601f10610387576101008083540402835291602001916103b0565b820191905f5260205f20905b81548152906001019060200180831161039357829003601f168201915b50505050509050919050565b6103d683838360405180602001604052805f815250610743565b505050565b5f6103e46107d8565b90508073ffffffffffffffffffffffffffffffffffffffff168673ffffffffffffffffffffffffffffffffffffffff1614158015610429575061042786826105a5565b155b1561046d5780866040517fe237d922000000000000000000000000000000000000000000000000000000008152600401610464929190611c81565b60405180910390fd5b61047a86868686866107df565b505050505050565b606081518351146104ce57815183516040517f5b0599910000000000000000000000000000000000000000000000000000000081526004016104c5929190611ca8565b60405180910390fd5b5f835167ffffffffffffffff8111156104ea576104e9611618565b5b6040519080825280602002602001820160405280156105185781602001602082028036833780820191505090505b5090505f5b84518110156105845761055461053c82876108d390919063ffffffff16565b61054f83876108e690919063ffffffff16565b6101f4565b82828151811061056757610566611ccf565b5b6020026020010181815250508061057d90611d29565b905061051d565b508091505092915050565b6105a161059a6107d8565b83836108f9565b5050565b5f60015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b5f61063c6107d8565b90508073ffffffffffffffffffffffffffffffffffffffff168673ffffffffffffffffffffffffffffffffffffffff1614158015610681575061067f86826105a5565b155b156106c55780866040517fe237d9220000000000000000000000000000000000000000000000000000000081526004016106bc929190611c81565b60405180910390fd5b6106d28686868686610a62565b505050505050565b5f7f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036107b3575f6040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016107aa9190611d70565b60405180910390fd5b5f806107bf8585610b68565b915091506107d05f87848487610b98565b505050505050565b5f33905090565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff160361084f575f6040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016108469190611d70565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff16036108bf575f6040517f01a835140000000000000000000000000000000000000000000000000000000081526004016108b69190611d70565b60405180910390fd5b6108cc8585858585610b98565b5050505050565b5f60208202602084010151905092915050565b5f60208202602084010151905092915050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610969575f6040517fced3e1000000000000000000000000000000000000000000000000000000000081526004016109609190611d70565b60405180910390fd5b8060015f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3183604051610a5591906114d6565b60405180910390a3505050565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1603610ad2575f6040517f57f447ce000000000000000000000000000000000000000000000000000000008152600401610ac99190611d70565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1603610b42575f6040517f01a83514000000000000000000000000000000000000000000000000000000008152600401610b399190611d70565b60405180910390fd5b5f80610b4e8585610b68565b91509150610b5f8787848487610b98565b50505050505050565b60608060405191506001825283602083015260408201905060018152826020820152604081016040529250929050565b610ba485858585610c44565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614610c3d575f610be06107d8565b90506001845103610c2c575f610bff5f866108e690919063ffffffff16565b90505f610c155f866108e690919063ffffffff16565b9050610c25838989858589610fda565b5050610c3b565b610c3a818787878787611189565b5b505b5050505050565b8051825114610c8e57815181516040517f5b059991000000000000000000000000000000000000000000000000000000008152600401610c85929190611ca8565b60405180910390fd5b5f610c976107d8565b90505f5b8351811015610e99575f610cb882866108e690919063ffffffff16565b90505f610cce83866108e690919063ffffffff16565b90505f73ffffffffffffffffffffffffffffffffffffffff168873ffffffffffffffffffffffffffffffffffffffff1614610df1575f805f8481526020019081526020015f205f8a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610d9d57888183856040517f03dee4c5000000000000000000000000000000000000000000000000000000008152600401610d949493929190611d89565b60405180910390fd5b8181035f808581526020019081526020015f205f8b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff1614610e8657805f808481526020019081526020015f205f8973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f828254610e7e9190611dcc565b925050819055505b505080610e9290611d29565b9050610c9b565b506001835103610f54575f610eb75f856108e690919063ffffffff16565b90505f610ecd5f856108e690919063ffffffff16565b90508573ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f628585604051610f45929190611ca8565b60405180910390a45050610fd3565b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb8686604051610fca929190611dff565b60405180910390a45b5050505050565b5f8473ffffffffffffffffffffffffffffffffffffffff163b1115611181578373ffffffffffffffffffffffffffffffffffffffff1663f23a6e6187878686866040518663ffffffff1660e01b815260040161103a959493929190611e86565b6020604051808303815f875af192505050801561107557506040513d601f19601f820116820180604052508101906110729190611ef2565b60015b6110f6573d805f81146110a3576040519150601f19603f3d011682016040523d82523d5f602084013e6110a8565b606091505b505f8151036110ee57846040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016110e59190611d70565b60405180910390fd5b805181602001fd5b63f23a6e6160e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461117f57846040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016111769190611d70565b60405180910390fd5b505b505050505050565b5f8473ffffffffffffffffffffffffffffffffffffffff163b1115611330578373ffffffffffffffffffffffffffffffffffffffff1663bc197c8187878686866040518663ffffffff1660e01b81526004016111e9959493929190611f1d565b6020604051808303815f875af192505050801561122457506040513d601f19601f820116820180604052508101906112219190611ef2565b60015b6112a5573d805f8114611252576040519150601f19603f3d011682016040523d82523d5f602084013e611257565b606091505b505f81510361129d57846040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016112949190611d70565b60405180910390fd5b805181602001fd5b63bc197c8160e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461132e57846040517f57f447ce0000000000000000000000000000000000000000000000000000000081526004016113259190611d70565b60405180910390fd5b505b505050505050565b5f604051905090565b5f80fd5b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61137282611349565b9050919050565b61138281611368565b811461138c575f80fd5b50565b5f8135905061139d81611379565b92915050565b5f819050919050565b6113b5816113a3565b81146113bf575f80fd5b50565b5f813590506113d0816113ac565b92915050565b5f80604083850312156113ec576113eb611341565b5b5f6113f98582860161138f565b925050602061140a858286016113c2565b9150509250929050565b61141d816113a3565b82525050565b5f6020820190506114365f830184611414565b92915050565b5f7fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6114708161143c565b811461147a575f80fd5b50565b5f8135905061148b81611467565b92915050565b5f602082840312156114a6576114a5611341565b5b5f6114b38482850161147d565b91505092915050565b5f8115159050919050565b6114d0816114bc565b82525050565b5f6020820190506114e95f8301846114c7565b92915050565b5f6020828403121561150457611503611341565b5b5f611511848285016113c2565b91505092915050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015611551578082015181840152602081019050611536565b5f8484015250505050565b5f601f19601f8301169050919050565b5f6115768261151a565b6115808185611524565b9350611590818560208601611534565b6115998161155c565b840191505092915050565b5f6020820190508181035f8301526115bc818461156c565b905092915050565b5f805f606084860312156115db576115da611341565b5b5f6115e88682870161138f565b93505060206115f9868287016113c2565b925050604061160a868287016113c2565b9150509250925092565b5f80fd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61164e8261155c565b810181811067ffffffffffffffff8211171561166d5761166c611618565b5b80604052505050565b5f61167f611338565b905061168b8282611645565b919050565b5f67ffffffffffffffff8211156116aa576116a9611618565b5b602082029050602081019050919050565b5f80fd5b5f6116d16116cc84611690565b611676565b905080838252602082019050602084028301858111156116f4576116f36116bb565b5b835b8181101561171d578061170988826113c2565b8452602084019350506020810190506116f6565b5050509392505050565b5f82601f83011261173b5761173a611614565b5b813561174b8482602086016116bf565b91505092915050565b5f80fd5b5f67ffffffffffffffff82111561177257611771611618565b5b61177b8261155c565b9050602081019050919050565b828183375f83830152505050565b5f6117a86117a384611758565b611676565b9050828152602081018484840111156117c4576117c3611754565b5b6117cf848285611788565b509392505050565b5f82601f8301126117eb576117ea611614565b5b81356117fb848260208601611796565b91505092915050565b5f805f805f60a0868803121561181d5761181c611341565b5b5f61182a8882890161138f565b955050602061183b8882890161138f565b945050604086013567ffffffffffffffff81111561185c5761185b611345565b5b61186888828901611727565b935050606086013567ffffffffffffffff81111561188957611888611345565b5b61189588828901611727565b925050608086013567ffffffffffffffff8111156118b6576118b5611345565b5b6118c2888289016117d7565b9150509295509295909350565b5f67ffffffffffffffff8211156118e9576118e8611618565b5b602082029050602081019050919050565b5f61190c611907846118cf565b611676565b9050808382526020820190506020840283018581111561192f5761192e6116bb565b5b835b818110156119585780611944888261138f565b845260208401935050602081019050611931565b5050509392505050565b5f82601f83011261197657611975611614565b5b81356119868482602086016118fa565b91505092915050565b5f80604083850312156119a5576119a4611341565b5b5f83013567ffffffffffffffff8111156119c2576119c1611345565b5b6119ce85828601611962565b925050602083013567ffffffffffffffff8111156119ef576119ee611345565b5b6119fb85828601611727565b9150509250929050565b5f81519050919050565b5f82825260208201905092915050565b5f819050602082019050919050565b611a37816113a3565b82525050565b5f611a488383611a2e565b60208301905092915050565b5f602082019050919050565b5f611a6a82611a05565b611a748185611a0f565b9350611a7f83611a1f565b805f5b83811015611aaf578151611a968882611a3d565b9750611aa183611a54565b925050600181019050611a82565b5085935050505092915050565b5f6020820190508181035f830152611ad48184611a60565b905092915050565b611ae5816114bc565b8114611aef575f80fd5b50565b5f81359050611b0081611adc565b92915050565b5f8060408385031215611b1c57611b1b611341565b5b5f611b298582860161138f565b9250506020611b3a85828601611af2565b9150509250929050565b5f8060408385031215611b5a57611b59611341565b5b5f611b678582860161138f565b9250506020611b788582860161138f565b9150509250929050565b5f805f805f60a08688031215611b9b57611b9a611341565b5b5f611ba88882890161138f565b9550506020611bb98882890161138f565b9450506040611bca888289016113c2565b9350506060611bdb888289016113c2565b925050608086013567ffffffffffffffff811115611bfc57611bfb611345565b5b611c08888289016117d7565b9150509295509295909350565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680611c5957607f821691505b602082108103611c6c57611c6b611c15565b5b50919050565b611c7b81611368565b82525050565b5f604082019050611c945f830185611c72565b611ca16020830184611c72565b9392505050565b5f604082019050611cbb5f830185611414565b611cc86020830184611414565b9392505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f611d33826113a3565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611d6557611d64611cfc565b5b600182019050919050565b5f602082019050611d835f830184611c72565b92915050565b5f608082019050611d9c5f830187611c72565b611da96020830186611414565b611db66040830185611414565b611dc36060830184611414565b95945050505050565b5f611dd6826113a3565b9150611de1836113a3565b9250828201905080821115611df957611df8611cfc565b5b92915050565b5f6040820190508181035f830152611e178185611a60565b90508181036020830152611e2b8184611a60565b90509392505050565b5f81519050919050565b5f82825260208201905092915050565b5f611e5882611e34565b611e628185611e3e565b9350611e72818560208601611534565b611e7b8161155c565b840191505092915050565b5f60a082019050611e995f830188611c72565b611ea66020830187611c72565b611eb36040830186611414565b611ec06060830185611414565b8181036080830152611ed28184611e4e565b90509695505050505050565b5f81519050611eec81611467565b92915050565b5f60208284031215611f0757611f06611341565b5b5f611f1484828501611ede565b91505092915050565b5f60a082019050611f305f830188611c72565b611f3d6020830187611c72565b8181036040830152611f4f8186611a60565b90508181036060830152611f638185611a60565b90508181036080830152611f778184611e4e565b9050969550505050505056fea264697066735822122099aa1b36b2fc8a8527592b546d55920ee3a56c886051eafdede445b7a1480d1164736f6c63430008140033';

export const deploy1155 = async (req: Request, res: Response) => {
  try {
    const provider = getProvider();
    const contract = new provider.eth.Contract(erc_1155_abi as AbiItem[]);
    const account = (await provider.eth.getAccounts())[0];
    await contract
      .deploy({ data: testErc1155Bytecode })
      .send({ from: account, gas: '5000000' })
      .on('receipt', function (receipt) {
        res
          .status(200)
          .json({ contractAddress: receipt.contractAddress })
          .send();
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const mint1155 = async (req: Request, res: Response) => {
  try {
    const request: erc1155Mint = req.body;
    const provider = getProvider();
    const contract = erc_1155(request.contractAddress, provider);
    const accounts = await provider.eth.getAccounts();

    const tx = await contract.methods.mint(
      request.to,
      Number(request.tokenId),
      request.amount,
    );
    const txReceipt = await tx.send({ from: accounts[0], gas: '500000' });

    res.status(200).json({ block: txReceipt['blockNumber'].toString() }).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
