import { ApiProperty } from '@nestjs/swagger'

export class PixelInfosBo {
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

  @ApiProperty({
    description: "Price the player has to pay to change the pixel's color",
    type: String,
    example: 'erd...'
  })
    priceToChange: string

  constructor(
    x: number,
    y: number,
    priceToChange: string
  ) {
    this.x = x
    this.y = y
    this.priceToChange = priceToChange
  }
}
