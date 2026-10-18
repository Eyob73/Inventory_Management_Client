import { proxyRequest } from '../_proxy';

export async function onRequest(context: { request: Request; env: any }): Promise<Response> {
  return proxyRequest(context.request, context.env);
}
