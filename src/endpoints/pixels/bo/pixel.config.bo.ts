import { ApiProperty } from '@nestjs/swagger'
import { PixelAvailableColorsBo } from './pixel.available.colors.bo'

export class PixelConfigBo {
  @ApiProperty({
    description: 'x coordinate of the pixel',
    type: PixelAvailableColorsBo,
    isArray: true
  })
    availableColors: PixelAvailableColorsBo[]

  constructor(
    availableColors: PixelAvailableColorsBo[]
  ) {
    this.availableColors = availableColors
  }
}
