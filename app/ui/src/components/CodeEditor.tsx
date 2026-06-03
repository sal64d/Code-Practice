import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { useCallback, useEffect, useState } from 'react'

interface CodeEditorProps {
  initialCode: string
  onChange: (value: string) => void
  language?: 'javascript' | 'php'
  draftKey: string
}

export function CodeEditor({ initialCode, onChange, language = 'javascript', draftKey }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  useEffect(() => {
    const draft = localStorage.getItem(draftKey)
    if (draft !== null) {
      setCode(draft)
      onChange(draft)
    } else {
      setCode(initialCode)
      onChange(initialCode)
    }
  }, [draftKey, initialCode, onChange])

  const handleChange = useCallback(
    (value: string) => {
      setCode(value)
      onChange(value)
      localStorage.setItem(draftKey, value)
    },
    [draftKey, onChange]
  )

  const extensions = [language === 'javascript' ? javascript({ jsx: true }) : javascript()]

  return (
    <div className="code-editor-wrapper" style={{ flex: 1, overflow: 'auto', border: '1px solid #ccc' }}>
      <CodeMirror
        value={code}
        height="100%"
        extensions={extensions}
        onChange={handleChange}
        theme="dark"
        style={{ height: '100%' }}
      />
    </div>
  )
}
