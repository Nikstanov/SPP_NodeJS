import * as Fingerprint2 from 'fingerprintjs2'
import UAParser from 'ua-parser-js'

export function _getFingerprint() {
  return new Promise((resolve, reject) => {
    async function getHash() {
      const options = {
        excludes: {
          plugins: true,
          localStorage: true,
          adBlock: true,
          screenResolution: true,
          availableScreenResolution: true,
          enumerateDevices: true,
          pixelRatio: true,
          doNotTrack: true
        },
        preprocessor: (key: any, value: any) => {
          if (key === 'userAgent') {
            const parser = new UAParser(value)
            // return customized user agent (without browser version)
            return `${parser.getOS().name} :: ${parser.getBrowser().name} :: ${parser.getEngine().name}`
          }
          return value
        }
      }

      try {
        const components = await Fingerprint2.getPromise(options)
        const values = components.map((component: any) => component.value)
        console.log('fingerprint hash components', components)

        return String(Fingerprint2.x64hash128(values.join(''), 31))
      } catch (e) {
        reject(e)
      }
    }

    if (window.requestIdleCallback) {
      console.log('requestIdleCallback')
      requestIdleCallback(async () => resolve(await getHash()))
    } else {
      console.log('setTimeout')
      setTimeout(async () => resolve(await getHash()), 500)
    }
  })
}
