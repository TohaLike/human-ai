import Versions from './components/Versions'

function App(): React.JSX.Element {
  const ipcHandle = async (): Promise<void> => {
    const result = await window.system.ping()
    console.log(result)
  }

  const openBrowser = async () => {
    await window.browser.open('')
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
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
