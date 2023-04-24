import { Injectable } from '@nestjs/common'
import { PixelsBo } from './bo/pixels.bo'
import { VmQueryService } from '../../common/contracts/vm.query.service'
import { type Struct, type U64Value, type VariadicValue } from '@multiversx/sdk-core/out'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PixelEntity } from './entity/pixel.entity'
import { CachingService, Constants } from '@multiversx/sdk-nestjs'

interface GetPixelInfos {
  x: number
  y: number
  infos: {}
}

@Injectable()
export class PixelsService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    @InjectRepository(PixelEntity)
    private readonly pixelsRepository: Repository<PixelEntity>
  ) {
  }

  async getAllPixels(): Promise<PixelsBo[]> {
    await this.pixelsRepository.clear()

    const gridSize = await this.getGridSize()
    const chunkSize = '10'

    const allPixelsInfos: GetPixelInfos[] = []

    for (let x = 0; x < gridSize; x += Number(chunkSize)) {
      for (let y = 0; y < gridSize; y += Number(chunkSize)) {
        allPixelsInfos.push(...await this.getPixelsInfos(x.toString(), y.toString(), chunkSize))
        console.log(`Fetched x: ${x}, y: ${y}`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    for (const pixelInfos of allPixelsInfos) {
      const pixelEntity = new PixelEntity()

      pixelEntity.x = pixelInfos.x
      pixelEntity.y = pixelInfos.y

      await this.pixelsRepository.insert(pixelEntity)
    }

    return allPixelsInfos.map(e => new PixelsBo(
      e.x,
      e.y
    ))
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
      'erd1qqqqqqqqqqqqqpgqargepfzrza0t6kwcmeztygnxl6lszpyuvl0szyvsqz',
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
      'erd1qqqqqqqqqqqqqpgqargepfzrza0t6kwcmeztygnxl6lszpyuvl0szyvsqz',
      'getPixels',
      [
        x,
        y,
        size
      ]
    )).firstValue as VariadicValue).getItems()

    return items.map(e => this.parsePixel(e as Struct))
  }
}
