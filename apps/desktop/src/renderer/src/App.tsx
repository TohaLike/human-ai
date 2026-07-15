import { useState } from 'react'
import Versions from './components/Versions'

function App(): React.JSX.Element {
  const [log, setLog] = useState<string>('')

  const appendLog = (message: string): void => {
    setLog((prev) => (prev ? `${prev}\n${message}` : message))
  }

  const ipcHandle = async (): Promise<void> => {
    const result = await window.system.ping()
    appendLog(`ping: ${result}`)
  }

  const openBrowser = async (): Promise<void> => {
    await window.browser.open('')
    appendLog('browser opened')
  }

  const loadPending = async (): Promise<void> => {
    const pending = await window.replies.pending()
    appendLog(`pending (${pending.length}):`)
    for (const reply of pending) {
      appendLog(`- ${reply.id}: ${reply.text}`)
    }
  }

  const approveAndSendLatest = async (): Promise<void> => {
    const pending = await window.replies.pending()

    if (pending.length === 0) {
      appendLog('no pending replies')
      return
    }

    const reply = pending[0]
    const sent = await window.replies.approveAndSend(reply.id)
    appendLog(`sent: ${sent.text} (${sent.status})`)
  }

  return (
    <>
      <div className="actions">
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={openBrowser}>
            Open Browser
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={loadPending}>
            Replies: pending
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={approveAndSendLatest}>
            Replies: approve + send
          </a>
        </div>
      </div>
      {log ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            maxWidth: 640,
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            fontSize: 12
          }}
        >
          {log}
        </pre>
      ) : null}
      <Versions></Versions>
    </>
  )
}

export default App
