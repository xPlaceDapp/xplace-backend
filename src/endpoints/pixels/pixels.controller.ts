import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { PixelsBo } from './bo/pixels.bo'
import { ApiResponse } from '@nestjs/swagger'
import { PixelsService } from './pixels.service'
import { PixelInfosBo } from './bo/pixel.infos.bo'
import { PixelConfigBo } from './bo/pixel.config.bo'

@Controller('pixels')
export class PixelsController {
  constructor(
    private readonly pixelsService: PixelsService
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of pixels',
    type: PixelsBo,
    isArray: true
  })
  async getAllPixels(): Promise<PixelsBo[]> {
    return await this.pixelsService.getAllPixels()
  }

  @Get('/config')
  @ApiResponse({
    status: 200,
    description: 'Returns the config',
    type: PixelConfigBo
  })
  async getConfig(): Promise<PixelConfigBo> {
    return await this.pixelsService.getConfig()
  }

  @Get(':x/:y/infos')
  @ApiResponse({
    status: 200,
    description: "Return the given pixel's infos",
    type: PixelInfosBo
  })
  async getPixelInfos(@Param('x', ParseIntPipe) x: number, @Param('y', ParseIntPipe) y: number): Promise<PixelInfosBo> {
    return await this.pixelsService.getPixelInfos(x, y)
  }
}
