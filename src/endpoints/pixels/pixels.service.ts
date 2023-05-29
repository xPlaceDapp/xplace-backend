import { Injectable } from '@nestjs/common'
import { PixelsBo } from './bo/pixels.bo'
import { VmQueryService } from '../../common/contracts/vm.query.service'
import {
  type AddressValue,
  BinaryCodec, type EnumValue,
  type Struct, type StructType,
  TupleType,
  U64Type,
  type U64Value,
  type VariadicValue
} from '@multiversx/sdk-core/out'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PixelEntity } from './entity/pixel.entity'
import { CachingService, Constants } from '@multiversx/sdk-nestjs'
import { ElasticService } from '../../common/elastic/elastic.service'
import { type ElasticTransactionsResult } from '../../common/elastic/types/elastic.transactions.result'
import type BigNumber from 'bignumber.js'

interface GetPixelInfos {
  x: number
  y: number
  infos: {}
}

interface PixelInfos {
  address: string
  color: string
  playedCount: number
}

export const CONTRACT_ADDRESS = 'erd1qqqqqqqqqqqqqpgqrl30e8leuhsr5ev5q7gdr6h5s0xs8rrxvl0sjmch0u' // TODO : remove

@Injectable()
export class PixelsService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    @InjectRepository(PixelEntity)
    private readonly pixelsRepository: Repository<PixelEntity>,
    private readonly elasticService: ElasticService
  ) {
  }

  async getAllPixels(): Promise<PixelsBo[]> {
    const lastPixelUpdate = await this.getLastPixelUpdate()

    if (lastPixelUpdate === null) {
      return await this.refreshAllPixels()
    } else {
      await this.refreshLatestPixels()

      const pixelsEntities = await this.pixelsRepository.find()

      return pixelsEntities.map(e => new PixelsBo(
        e.x,
        e.y
      ))
    }
  }

  private async refreshAllPixels(): Promise<PixelsBo[]> {
    await this.pixelsRepository.clear()

    const now = new Date()

    const gridSize = await this.getGridSize()
    const chunkSize = '10'

    const allPixelsInfos: GetPixelInfos[] = []

    for (let x = 0; x < gridSize; x += Number(chunkSize)) {
      for (let y = 0; y < gridSize; y += Number(chunkSize)) {
        allPixelsInfos.push(...await this.getPixelsInfos(x.toString(), y.toString(), chunkSize))
        console.log(`Fetched x: ${x}, y: ${y}`)
      }
    }

    for (const pixelInfos of allPixelsInfos) {
      const pixelEntity = new PixelEntity()

      pixelEntity.x = pixelInfos.x
      pixelEntity.y = pixelInfos.y

      await this.pixelsRepository.insert(pixelEntity)
    }

    await this.setLastPixelUpdate(now)

    return allPixelsInfos.map(e => new PixelsBo(
      e.x,
      e.y
    ))
  }

  private async refreshLatestPixels(): Promise<void> {
    const now = new Date()

    const pixelsToRefresh: GetPixelInfos[] = []
    const transactionsRequestBody = {
      sort: [
        {
          timestamp: 'desc'
        }
      ],
      query: {
        bool: {
          filter: [
            {
              match: {
                receiver: CONTRACT_ADDRESS
              }
            },
            {
              match: {
                function: 'changePixelColor'
              }
            }
          ]
        }
      }
    }

    const transactions: ElasticTransactionsResult = await this.elasticService.queryTransactions(transactionsRequestBody)

    for (const transaction of transactions.hits.hits) {
      const logsBody = {
        sort: [
          {
            timestamp: 'desc'
          }
        ],
        query: {
          bool: {
            filter: [
              {
                match: {
                  _id: transaction._id
                }
              }
            ]
          }
        }
      }

      const logs = await this.elasticService.queryLogs(logsBody)

      if (logs.hits.hits.length !== 1) {
        throw new Error('Invalid logs')
      }

      const event = logs.hits.hits[0]._source.events.find(e => e.identifier === 'changePixelColor')

      if (event === undefined) {
        throw new Error('Invalid event')
      }

      const codec = new BinaryCodec()
      const coordinatesType = new TupleType(new U64Type(), new U64Type())
      const coordinatesTopic = event.topics[1]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const coordinatesValue = codec.decodeTopLevel(Buffer.from(coordinatesTopic, 'base64'), coordinatesType) as Struct
      const x: BigNumber = coordinatesValue.getFieldValue('field0')
      const y: BigNumber = coordinatesValue.getFieldValue('field1')

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const pixelInfosStruct = codec.decodeTopLevel(Buffer.from(event.data, 'base64'), this.getPixelsInfosType()) as Struct
      const pixelInfos = this.parsePixelInfos(pixelInfosStruct)

      pixelsToRefresh.push({
        x: x.toNumber(),
        y: y.toNumber(),
        infos: pixelInfos
      })
    }

    await this.changePixelsInDatabase(pixelsToRefresh)

    await this.setLastPixelUpdate(now)
  }

  private parsePixel(pixelStruct: Struct): GetPixelInfos {
    const x = (pixelStruct.getFieldValue('x') as U64Value).valueOf() as unknown as number
    const y = (pixelStruct.getFieldValue('y') as U64Value).valueOf() as unknown as number

    return {
      x,
      y,
      infos: {}
    }
  }

  private async getGridSize(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'grid-size',
      async () => await this.getGridSizeRaw(),
      Constants.oneMonth()
    )
  }

  private async getGridSizeRaw(): Promise<number> {
    return Number(await this.vmQueryService.queryAndGetU64(
      CONTRACT_ADDRESS,
      'getGridSize',
      []
    ))
  }

  private async getPixelsInfos(x: string, y: string, size: string): Promise<GetPixelInfos[]> {
    return await this.cachingService.getOrSetCache(
        `pixels-${x}-${y}-${size}`,
        async () => await this.getPixelsInfosRaw(x, y, size),
        Constants.oneSecond() * 6
    )
  }

  private async getPixelsInfosRaw(x: string, y: string, size: string): Promise<GetPixelInfos[]> {
    const items = ((await this.vmQueryService.query(
      CONTRACT_ADDRESS,
      'getPixels',
      [
        x,
        y,
        size
      ]
    )).firstValue as VariadicValue).getItems()

    return items.map(e => this.parsePixel(e as Struct))
  }

  private async getLastPixelUpdate(): Promise<Date | undefined> {
    const dateString = await this.cachingService.getCache<string>('last-pixel-update')

    if (dateString === undefined) {
      return undefined
    }

    return new Date(dateString)
  }

  private async setLastPixelUpdate(date: Date): Promise<void> {
    await this.cachingService.setCache(
      'last-pixel-update',
      date.toISOString(),
      Constants.oneSecond() * 6
    )
  }

  private async changePixelsInDatabase(pixels: GetPixelInfos[]): Promise<void> {
    for (const pixel of pixels) {
      let pixelEntity: PixelEntity | null = await this.pixelsRepository.findOne({
        where: {
          x: pixel.x,
          y: pixel.y
        }
      })

      if (pixelEntity === null) {
        pixelEntity = new PixelEntity()
      }

      pixelEntity.x = pixel.x
      pixelEntity.y = pixel.y

      await this.pixelsRepository.save(pixelEntity)
    }
  }

  private parsePixelInfos(pixelInfosStruct: Struct): PixelInfos {
    const address = pixelInfosStruct.getFieldValue('address') as AddressValue
    const color = pixelInfosStruct.getFieldValue('color') as EnumValue
    const playedCount = pixelInfosStruct.getFieldValue('played_count') as BigNumber

    return {
      address: address.valueOf().bech32(),
      color: color.name,
      playedCount: playedCount.toNumber()
    }
  }

  private getPixelsInfosType(): StructType {
    const abi = VmQueryService.getContractAbi()
    return abi.getStruct('PixelInfos')
  }
}
