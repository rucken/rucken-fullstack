import { createNestModule, NestModuleCategory } from '@nestjs-mod/common';
import { RUCKEN_ENGINE_MODULE } from './engine.constants';

export const { RuckenEngineModule } = createNestModule({
  moduleName: RUCKEN_ENGINE_MODULE,
  moduleCategory: NestModuleCategory.feature,
});
