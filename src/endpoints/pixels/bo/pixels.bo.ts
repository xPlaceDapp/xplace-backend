import { ApiProperty } from '@nestjs/swagger'

export class PixelsBo {
  @ApiProperty({
    description: 'x coordinate of the pixel',
    type: Number,
    example: 8
  })
    x: number

  @ApiProperty({
    description: 'y coordinate of the pixel',
    type: Number,
    example: 15
  })
    y: number

  constructor(
    x: number,
    y: number
  ) {
    this.x = x
    this.y = y
  }
}
