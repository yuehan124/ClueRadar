import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Connect, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 子路径部署时，浏览器输入 http://ip:port/radar（不带尾斜杠）会 404，
 * 因为 dev/preview 只认 /radar/。这里补一个 302 到带斜杠的版本，
 * 让用户按需求里写的 http://ip:port/radar 直接就能打开。
 * （nginx 等真实静态服务器会自己 301，不依赖这个插件。）
 */
function baseTrailingSlash(): Plugin {
  let base = '/'

  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const bare = base.replace(/\/+$/, '')
    if (!bare) {
      next()
      return
    }
    const url = req.url || ''
    if (url === bare || url.startsWith(`${bare}?`)) {
      res.writeHead(302, { Location: `${bare}/${url.slice(bare.length)}` })
      res.end()
      return
    }
    next()
  }

  return {
    name: 'base-trailing-slash',
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  // 部署在子路径下，线上通过 http://ip:port/radar/ 访问。
  // 这个值会注入 import.meta.env.BASE_URL，路由 base 直接复用它，避免两处写法不一致。
  base: '/radar/',
  plugins: [vue(), baseTrailingSlash()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5273,
    // 监听 0.0.0.0，方便用 ip:port/radar/ 从局域网访问
    host: true,
    open: false,
  },
  preview: {
    port: 4273,
    host: true,
  },
})
