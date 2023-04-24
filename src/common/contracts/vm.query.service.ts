import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import {
  AbiRegistry,
  Address, NumericalValue,
  ResultsParser,
  SmartContract,
  SmartContractAbi,
  type TypedOutcomeBundle
} from '@multiversx/sdk-core/out'
import { ErrorsConstants } from '../../utils/errors.constants'
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out'
import xplaceAbi from '../../abi/xplace.abi'

@Injectable()
export class VmQueryService {
  async query(
    contractAddress: string,
    functionName: string,
    args: Array<string | object>
  ): Promise<TypedOutcomeBundle> {
    const abiJson = xplaceAbi
    const abiRegistry = AbiRegistry.create(abiJson)
    const abi = new SmartContractAbi(abiRegistry, [''])

    const contract = new SmartContract({
      address: new Address(contractAddress),
      abi
    })

    const queryInteraction = contract.methods[functionName](
      args
    )

    const query = queryInteraction.buildQuery()
    const provider = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com')

    try {
      await provider.queryContract(query)
    } catch (e) {
      console.log(e)
    }

    const response = await provider.queryContract(query)

    if (response.returnCode !== 'ok') {
      console.error(ErrorsConstants.UNABLE_TO_QUERY_CONTRACT, `contract address : ${contractAddress}`)
      throw new HttpException(ErrorsConstants.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const resultsParser = new ResultsParser()

    return resultsParser.parseQueryResponse(response, abi.getEndpoint(functionName))
  }

  async queryAndGetU64(
    contractAddress: string,
    functionName: string,
    args: Array<string | object>
  ): Promise<string> {
    const result = await this.query(
      contractAddress,
      functionName,
      args
    )

    const firstValue = result.firstValue

    if ((firstValue == null) || (firstValue.constructor !== NumericalValue)) {
      throw new HttpException(ErrorsConstants.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return (firstValue as NumericalValue).value.toString()
  }
}
