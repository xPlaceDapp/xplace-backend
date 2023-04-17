import {Controller, Get} from '@nestjs/common';
import {PixelsBo} from "./bo/pixels.bo";
import {ApiResponse} from "@nestjs/swagger";

@Controller('pixels')
export class PixelsController {

    @Get()
    @ApiResponse({
        status: 200,
        description: 'Returns a list of pixels',
        type: PixelsBo,
        isArray: true,
    })
    async getAllPixels(): Promise<Array<PixelsBo>> {
        return [
            new PixelsBo(1, 2),
            new PixelsBo(3, 4),
        ];
    }

}
