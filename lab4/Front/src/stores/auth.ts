import { signOut, refresh, signIn, signUp } from '@/api/authApi'
import type { Session } from '@/models/session'
import { _getFingerprint } from '@/utills/fingerprint'
import { defineStore } from 'pinia'
import { useTasksStore } from './tasks'
import { reconnect } from '@/api/taskApi'

export const useAuthStore = defineStore({
  id: 'authStore',
  state: () => ({
    isAuth: false,
    userId: '',
    accessToken: '',
    accessExpiredIn: 0,
    refreshToken: '',
    refreshExpiredIn: 0,
    mode: 'sign_in',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  }),

  actions: {
    updateToken(session: Session) {
      this.accessToken = session.token
      this.accessExpiredIn = session.expiresIn
      this.nickname = session.nickname
      this.refreshToken = session.refreshToken
      this.refreshExpiredIn = session.refreshTokenExpiresIn
      this.userId = session.userId
      this.isAuth = true
      reconnect()
    },
    init() {
      this.refresh()
    },
    changeMode() {
      this.mode = this.mode === 'sign_in' ? 'sign_up' : 'sign_in'
    },
    async auth() {
      let res = null
      if (this.mode === 'sign_in') {
        res = _getFingerprint().then((fingerpring) => {
          return signIn(this.email, this.password, fingerpring as string)
        })
      } else {
        if (this.password === this.confirmPassword) {
          res = _getFingerprint().then((fingerpring) => {
            return signUp(this.email, this.password, this.nickname, fingerpring as string)
          })
        }
      }
      res
        ?.then(
          (res) => {
            if (res) {
              this.updateToken(res)
            }
          },
          (err) => {}
        )
        .finally(() => {
          this.password = ''
          this.confirmPassword = ''
        })
    },
    signOut() {
      signOut().then(() => {
        this.accessToken = ''
        this.refreshToken = ''
        this.email = ''
        this.nickname = ''
        this.isAuth = false
        localStorage.removeItem('refresh_token')
        useTasksStore().clear()
      })
    },
    refresh() {
      return _getFingerprint().then((fingerpring) => {
        return refresh(this.refreshToken, fingerpring as string)
          .then((session) => {
            this.updateToken(session)
            return session.token
          })
          .catch((err) => {
            console.log(err)
            signOut()
            return ''
          })
      })
    },

    async getAccessToken(): Promise<string> {
      if (this.accessExpiredIn > Date.now()) {
        return this.accessToken
      } else {
        const token = await this.refresh()
        return token
      }
    }
  }
})
