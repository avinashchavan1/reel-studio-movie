// Route fetch() through HTTPS_PROXY when one is configured (corporate/cloud networks). No-op otherwise.
import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';
if (process.env.HTTPS_PROXY || process.env.https_proxy) setGlobalDispatcher(new EnvHttpProxyAgent());
