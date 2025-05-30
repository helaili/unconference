import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import type { NuxtPage } from '@nuxt/schema'
import logger from './utils/logger'

logger.info('Starting Unconference application...')
logger.info('Environment:', process.env.APP_ENV)
logger.info('TOPICS_FILE_PATH:', process.env.TOPICS_FILE_PATH)
logger.info('USERS_FILE_PATH:', process.env.USERS_FILE_PATH)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  hooks: {
    'pages:extend' (pages: NuxtPage[]) {
      function setMiddleware (pages: NuxtPage[]) {
        const publicPages = ['index', 'login', 'register']
        const adminPages = ['admin', 'settings'] // Add admin-only pages here
        
        for (const page of pages) {
          if (page.name && !publicPages.includes(page.name)) {
            logger.debug(`Setting authentication middleware for page: ${page.name}`)
            if (!page.meta) {
              page.meta = {}
            }
            page.meta.middleware = ['authenticated']
            
            // Add admin requirement for admin pages
            if (adminPages.includes(page.name)) {
              logger.debug(`Setting admin requirement for page: ${page.name}`)
              page.meta.requiresAdmin = true
            }
          }
          if (page.children) {
            setMiddleware(page.children)
          }
        }
      }
      setMiddleware(pages)
    }
  },
  modules: [
    // @ts-expect-error
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    'nuxt-auth-utils',
    '@nuxt/test-utils/module'
  ],
  runtimeConfig: {
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        apiURL: process.env.GITHUB_API_URL ? process.env.GITHUB_API_URL : 'https://api.github.com',
        authorizationURL: process.env.AUTH_GITHUB_URL ? process.env.AUTH_GITHUB_URL : 'https://github.com/login/oauth/authorize',
        tokenURL: process.env.GITHUB_TOKEN_URL ? process.env.GITHUB_TOKEN_URL : 'https://github.com/login/oauth/access_token',
      }
    },
    topicsFilePath: process.env.NUXT_TOPICS_FILE_PATH,
    usersFilePath: process.env.NUXT_USERS_FILE_PATH,
    public: {
      devMode: process.env.APP_ENV === 'development',
      authUrl: process.env.NUXT_AUTH_GITHUB === 'true' ?  '/auth/github' : '/login',
      maxVotesPerTopic: parseInt(process.env.NUXT_MAX_VOTES_PER_TOPIC || '12'),
      topTopicsCount: parseInt(process.env.NUXT_TOP_TOPICS_COUNT || '10')
    }
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    server: {
      allowedHosts: ['localhost', '.ngrok.dev'] 
    }
  },
})
