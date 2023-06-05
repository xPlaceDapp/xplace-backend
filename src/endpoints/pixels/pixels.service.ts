import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PixelsBo } from './bo/pixels.bo'
import { VmQueryService } from '../../common/contracts/vm.query.service'
import {
  type Address,
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
import { PixelColor, PixelEntity } from './entity/pixel.entity'
import { CachingService, Constants } from '@multiversx/sdk-nestjs'
import { ElasticService } from '../../common/elastic/elastic.service'
import { type ElasticTransactionsResult } from '../../common/elastic/types/elastic.transactions.result'
import type BigNumber from 'bignumber.js'
import { Interval } from '@nestjs/schedule'
import { PixelInfosBo } from './bo/pixel.infos.bo'

interface GetPixelInfos {
  x: number
  y: number
  infos: PixelInfos
}

interface PixelInfos {
  address: string
  color: string
  playedCount: number
}

export const CONTRACT_ADDRESS = 'erd1qqqqqqqqqqqqqpgq590zplleun0rdtts7kh5pk4cpjmuyaxdvl0s5jzxjl' // TODO : remove

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

    if (lastPixelUpdate === undefined) {
      return await this.refreshAllPixels()
    } else {
      const pixelsEntities = await this.pixelsRepository.find()

      return pixelsEntities.map(e => PixelsBo.fromEntity(e))
    }
  }

  async getPixelInfos(x: number, y: number): Promise<PixelInfosBo> {
    if (!(await this.validateCoordinates(x, y))) {
      throw new HttpException('Invalid coordinates : out of bounds', HttpStatus.BAD_REQUEST)
    }

    const pixelEntity = await this.pixelsRepository.findOne({
      where: {
        x,
        y
      }
    })

    let priceToChange = '0'

    if (pixelEntity !== null) {
      priceToChange = await this.getPixelPriceToChange(pixelEntity.playedCount)
    }

    return new PixelInfosBo(
      x,
      y,
      priceToChange
    )
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
      pixelEntity.address = pixelInfos.infos.address
      pixelEntity.color = PixelColor[pixelInfos.infos.color as keyof typeof PixelColor]
      pixelEntity.playedCount = pixelInfos.infos.playedCount

      await this.pixelsRepository.insert(pixelEntity)
    }

    await this.setLastPixelUpdate(now)

    return allPixelsInfos.map(e => {
      return new PixelsBo(
        e.x,
        e.y,
        e.infos.address,
        PixelColor[e.infos.color as keyof typeof PixelColor],
        e.infos.playedCount
      )
    })
  }

  @Interval(6000)
  async refreshLatestPixels(): Promise<void> {
    const latestPixelUpdate = await this.getLastPixelUpdate()

    if (latestPixelUpdate === undefined) {
      return
    }

    const latestPixelUpdateTimestamp = Math.floor((latestPixelUpdate.getTime()) / 1000)

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
              range: {
                timestamp: {
                  gt: latestPixelUpdateTimestamp,
                  lte: 'now'
                }
              }
            },
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

    if (transactions.hits.hits.length === 0) {
      console.log('No pixel to update')
      return
    }

    const latestTransactionTimestamp = Math.max(...transactions.hits.hits.map(e => e._source.timestamp))

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

    console.log(`Fetched ${pixelsToRefresh.length} pixels`)
    console.log(pixelsToRefresh)

    await this.changePixelsInDatabase(pixelsToRefresh)

    await this.setLastPixelUpdate(new Date(latestTransactionTimestamp * 1000))
  }

  private parsePixel(pixelStruct: Struct): GetPixelInfos {
    const x = (pixelStruct.getFieldValue('x') as U64Value).valueOf() as unknown as string
    const y = (pixelStruct.getFieldValue('y') as U64Value).valueOf() as unknown as string
    const infos = pixelStruct.getFieldValue('pixel_infos') as { address: Address, color: { name: string }, played_count: BigNumber }

    return {
      x: Number(x),
      y: Number(y),
      infos: {
        address: infos.address.bech32(),
        color: infos.color.name,
        playedCount: infos.played_count.toNumber()
      }
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

  private async getPixelPriceToChange(playedCount: number): Promise<string> {
    return await this.cachingService.getOrSetCache(
      `pixel-price-${playedCount}`,
      async () => await this.getPixelPriceToChangeRaw(playedCount),
      Constants.oneMinute() * 10
    )
  }

  private async getPixelPriceToChangeRaw(playedCount: number): Promise<string> {
    return (await this.vmQueryService.queryAndGetU64(
      CONTRACT_ADDRESS,
      'getPixelPrice',
      [
        playedCount.toString()
      ]
    ))
  }

  private async getLastPixelUpdate(): Promise<Date | undefined> {
    const dateString = await this.cachingService.getCache<string>('last-pixel-update')

    if (dateString === null) {
      return undefined
    }

    // @ts-expect-error error in the multiversx sdk
    return new Date(dateString)
  }

  private async setLastPixelUpdate(date: Date): Promise<void> {
    await this.cachingService.setCache(
      'last-pixel-update',
      date.toISOString(),
      Constants.oneMonth() * 24
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
      pixelEntity.address = pixel.infos.address
      pixelEntity.color = PixelColor[pixel.infos.color as keyof typeof PixelColor]
      pixelEntity.playedCount = pixel.infos.playedCount

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

  private async validateCoordinates(x: number, y: number): Promise<boolean> {
    const gridSize = await this.getGridSize()

    return x >= 0 && x < gridSize && y >= 0 && y < gridSize
  }
}
