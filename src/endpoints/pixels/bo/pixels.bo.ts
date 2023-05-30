import { ApiProperty } from '@nestjs/swagger'
import { PixelColor, type PixelEntity } from '../entity/pixel.entity'

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

  @ApiProperty({
    description: 'Address of the player that played the pixel',
    type: String,
    example: 15
  })
    address: string

  @ApiProperty({
    description: "Pixel's color",
    enum: PixelColor,
    example: PixelColor.Red
  })
    color: PixelColor

  @ApiProperty({
    description: 'How many times the pixel has been played',
    type: Number,
    example: 15
  })
    playedCount: number

  static fromEntity(entity: PixelEntity): PixelsBo {
    return new PixelsBo(
      entity.x,
      entity.y,
      entity.address,
      entity.color,
      entity.playedCount
    )
  }

  constructor(
    x: number,
    y: number,
    address: string,
    color: PixelColor,
    playedCount: number
  ) {
    this.x = x
    this.y = y
    this.address = address
    this.color = color
    this.playedCount = playedCount
  }
}
