import { ApiProperty } from '@nestjs/swagger'

export class PixelAvailableColorsBo {
  @ApiProperty({
    description: 'Hexadecimal color',
    type: String,
    example: '#000000'
  })
    colorHex: string

  @ApiProperty({
    description: 'Discriminant on-chain',
    type: Number,
    example: 0
  })
    discriminant: number

  constructor(
    colorHex: string,
    discriminant: number
  ) {
    this.colorHex = colorHex
    this.discriminant = discriminant
  }
}
