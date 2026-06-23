import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';

export class AckData {
  @ApiProperty({ type: 'boolean', default: true })
  acknowledged = true;
}

export class AckResponse extends OkResponse {
  @ApiProperty({ type: () => AckData })
  data!: AckData;
  constructor() {
    super();
    this.data = new AckData();
  }
}
