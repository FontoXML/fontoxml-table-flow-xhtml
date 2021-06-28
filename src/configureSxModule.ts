import type { SxModule } from 'fontoxml-modular-schema-experience/src/sxManager';

export default function configureSxModule(sxModule: SxModule): void {
	sxModule.markAsAddon();
}
