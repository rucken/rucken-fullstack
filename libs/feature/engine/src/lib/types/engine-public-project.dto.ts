import { OmitType } from '@nestjs/swagger';
import { EngineProjectDto } from '../generated/rest/dto/engine-project.dto';

export class EnginePublicProjectDto extends OmitType(EngineProjectDto, ['clientSecret', 'public']) {}
