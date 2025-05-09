import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getRouterManifest } from '@tanstack/start/router-manifest'

import { createRouter } from './router'

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler)