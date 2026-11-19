import { describe, expect, it } from 'vitest'
import { normalizeAudioSettings } from '../settings'

describe('normalizeAudioSettings', () => {
  it('falls back to defaults on missing or invalid data', () => {
    expect(normalizeAudioSettings(null)).toEqual({ musicOn: true, music: 0.5, sfxOn: true, sfx: 0.7 })
    expect(normalizeAudioSettings({ music: 'loud', sfx: 4 })).toMatchObject({ music: 0.5, sfx: 1 })
  })

  it('migrates the legacy muted flag', () => {
    expect(normalizeAudioSettings({ muted: true, music: 0.2 })).toEqual({
      musicOn: false,
      music: 0.2,
      sfxOn: false,
      sfx: 0.7,
    })
    expect(normalizeAudioSettings({ muted: false })).toMatchObject({ musicOn: true, sfxOn: true })
  })
})
