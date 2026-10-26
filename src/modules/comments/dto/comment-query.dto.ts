import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dtos';

export class CommentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Include nested replies' })
  includeReplies?: boolean;
}
