import Paper from '@mui/material/Paper';

export interface EditorContainerProps {
  children: React.ReactNode;
}

export function EditorContainer({ children }: EditorContainerProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1e1e1e', // Darker background for code editor
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '& .cm-editor': {
          height: '100%',
          outline: 'none',
        },
        '& .cm-scroller': {
          fontFamily: 'ui-monospace, Consolas, "Courier New", monospace',
        }
      }}
    >
      {children}
    </Paper>
  );
}
