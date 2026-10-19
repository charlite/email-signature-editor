import type { PagesFunction } from '@cloudflare/workers-types';
import { proxyExportImage } from '../_lib/exportImageProxy';

export const onRequest: PagesFunction = async (context) => {
  return proxyExportImage(context.request);
};
