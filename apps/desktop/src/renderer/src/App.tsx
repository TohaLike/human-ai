import { FormEvent, useEffect, useState } from 'react'
import type { AppConfig } from '../../main/config/types'
import Versions from './components/Versions'

const emptyConfig: AppConfig = {
  vkChatUrl: '',
  openRouterApiKey: '',
  openRouterModel: 'openai/gpt-4o-mini',
  aiTriggerOnOwnMessages: false,
  aiAutoSend: true,
  aiReplyDelayMs: 400,
  aiReplyDebounceMs: 800,
  aiTemperature: 0.75,
  aiMaxTokens: 120
}

function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig>(emptyConfig)
  const [log, setLog] = useState('')
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const appendLog = (message: string): void => {
    setLog((prev) => (prev ? `${prev}\n${message}` : message))
  }

  useEffect(() => {
    void window.config
      .get()
      .then((value) => {
        setConfig(value)
        setLoaded(true)
      })
      .catch((error: unknown) => {
        appendLog(`config load error: ${error instanceof Error ? error.message : String(error)}`)
        setLoaded(true)
      })
  }, [])

  const updateField = <K extends keyof AppConfig>(key: K, value: AppConfig[K]): void => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const saveConfig = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault()
    setSaving(true)

    try {
      const saved = await window.config.save(config)
      setConfig(saved)
      appendLog('настройки сохранены')
    } catch (error) {
      appendLog(`save error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const launchChat = async (): Promise<void> => {
    setLaunching(true)

    try {
      await window.config.save(config)
      const saved = await window.config.launchChat(config.vkChatUrl)
      setConfig(saved)
      appendLog(`браузер открыт: ${saved.vkChatUrl}`)
    } catch (error) {
      appendLog(`launch error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLaunching(false)
    }
  }

  const loadPending = async (): Promise<void> => {
    try {
      const pending = await window.replies.pending()
      appendLog(`pending (${pending.length}):`)
      for (const reply of pending) {
        appendLog(`- ${reply.id}: ${reply.text}`)
      }
    } catch (error) {
      appendLog(`pending error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const approveAndSendLatest = async (): Promise<void> => {
    try {
      const pending = await window.replies.pending()

      if (pending.length === 0) {
        appendLog('no pending replies')
        return
      }

      const reply = pending[0]
      const sent = await window.replies.approveAndSend(reply.id)
      appendLog(`sent: ${sent.text} (${sent.status})`)
    } catch (error) {
      appendLog(`send error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <h1>Human AI</h1>
        <p>Настройки AI и запуск чата VK</p>
      </header>

      <form className="settings-form" onSubmit={saveConfig}>
        <section className="settings-section">
          <h2>Чат VK</h2>
          <label className="field">
            <span>Ссылка на чат</span>
            <input
              type="url"
              placeholder="https://vk.com/im/convo/..."
              value={config.vkChatUrl}
              onChange={(event) => updateField('vkChatUrl', event.target.value)}
            />
          </label>
          <div className="field-actions">
            <button type="button" className="btn primary" onClick={launchChat} disabled={!loaded || launching}>
              {launching ? 'Открываю…' : 'Открыть чат в браузере'}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>AI сервис</h2>

          <label className="field">
            <span>OpenRouter API key</span>
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-or-v1-..."
              value={config.openRouterApiKey}
              onChange={(event) => updateField('openRouterApiKey', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Модель</span>
            <input
              type="text"
              placeholder="openai/gpt-4o-mini"
              value={config.openRouterModel}
              onChange={(event) => updateField('openRouterModel', event.target.value)}
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Delay перед отправкой (мс)</span>
              <input
                type="number"
                min={0}
                value={config.aiReplyDelayMs}
                onChange={(event) => updateField('aiReplyDelayMs', Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Debounce (мс)</span>
              <input
                type="number"
                min={0}
                value={config.aiReplyDebounceMs}
                onChange={(event) => updateField('aiReplyDebounceMs', Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Temperature</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={config.aiTemperature}
                onChange={(event) => updateField('aiTemperature', Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Max tokens</span>
              <input
                type="number"
                min={1}
                value={config.aiMaxTokens}
                onChange={(event) => updateField('aiMaxTokens', Number(event.target.value))}
              />
            </label>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={config.aiAutoSend}
              onChange={(event) => {
                const checked = event.target.checked
                updateField('aiAutoSend', checked)
                void window.config
                  .save({ ...config, aiAutoSend: checked })
                  .then((saved) => {
                    setConfig(saved)
                    appendLog(`автоотправка: ${checked ? 'вкл' : 'выкл'}`)
                  })
                  .catch((error: unknown) => {
                    appendLog(
                      `save error: ${error instanceof Error ? error.message : String(error)}`
                    )
                  })
              }}
            />
            <span>Автоотправка ответов в VK</span>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={config.aiTriggerOnOwnMessages}
              onChange={(event) => {
                const checked = event.target.checked
                updateField('aiTriggerOnOwnMessages', checked)
                void window.config
                  .save({ ...config, aiTriggerOnOwnMessages: checked })
                  .then((saved) => {
                    setConfig(saved)
                    appendLog(`отвечать на свои: ${checked ? 'вкл' : 'выкл'}`)
                  })
                  .catch((error: unknown) => {
                    appendLog(
                      `save error: ${error instanceof Error ? error.message : String(error)}`
                    )
                  })
              }}
            />
            <span>Отвечать на свои сообщения (self-chat тест)</span>
          </label>
        </section>

        <div className="field-actions">
          <button type="submit" className="btn" disabled={!loaded || saving}>
            {saving ? 'Сохраняю…' : 'Сохранить настройки'}
          </button>
          <button type="button" className="btn ghost" onClick={loadPending}>
            Pending replies
          </button>
          <button type="button" className="btn ghost" onClick={approveAndSendLatest}>
            Approve + send
          </button>
        </div>
      </form>

      {log ? <pre className="workspace-log">{log}</pre> : null}

      <Versions />
    </div>
  )
}

export default App
