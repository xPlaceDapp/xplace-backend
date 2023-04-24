import { Controller, Get } from '@nestjs/common'
import { PixelsBo } from './bo/pixels.bo'
import { ApiResponse } from '@nestjs/swagger'
import { PixelsService } from './pixels.service'

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
}
